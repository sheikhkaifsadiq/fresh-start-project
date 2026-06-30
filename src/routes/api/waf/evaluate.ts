import { createFileRoute } from "@tanstack/react-router";
import { createAdminClient } from "@/lib/supabase/admin.server";
import { requireInternalSecret } from "@/lib/auth/api-auth.server";
import { createSecureHandler } from "@/lib/security/global-middleware.server";
interface EvaluationContext {
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  countryCode?: string;
  asn?: string;
}

interface EvaluationResult {
  action: "ALLOW" | "BLOCK" | "CHALLENGE" | "RATE_LIMIT" | "DELAY";
  reason: string;
  botScore: number;
  matchedRuleId?: string;
  latencyMs: number;
}

class AegisWafEngine {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }

  public async evaluateRequest(context: EvaluationContext): Promise<EvaluationResult> {
    const supabase = createAdminClient();
    let botScore = 0.0;
    
    // 1. Static Checks (Blacklist, Rate Limits)
    const { data: blacklistHit } = await supabase
      .from("ip_blacklist")
      .select("id, reason")
      .eq("ip_address", context.ip)
      .eq("is_active", true)
      .maybeSingle();

    if (blacklistHit) {
      return this.finalize("BLOCK", "Blacklisted IP", botScore, blacklistHit.id);
    }

    // 2. Fetch Active WAF Rules (cached ideally)
    const { data: rules } = await supabase
      .from("waf_rules")
      .select("*")
      .eq("enabled", true)
      .order("priority", { ascending: true });

    if (rules && rules.length > 0) {
      for (const rule of rules) {
        if (this.evaluateRuleCondition(rule.condition, rule.target, rule.value, context)) {
          // If rule matched but action is LOG_ONLY, continue but log it.
          if (rule.action === "LOG_ONLY") {
            await this.logEvent("LOG_ONLY", context, botScore, rule.id);
            continue;
          }
          return this.finalize(rule.action as any, "WAF Rule Match", botScore, rule.id);
        }
      }
    }

    // 3. Call ML Engine for Bot Probability
    try {
      const ML_ORACLE_SERVER_URL = process.env.ORACLE_ML_SERVER_URL;
      const ML_SERVER_API_KEY = process.env.ORACLE_ML_API_KEY || "";

      if (!ML_ORACLE_SERVER_URL) {
        // Fail degraded — log and continue without ML score rather than using a hardcoded public IP
        console.warn("[WAF] ORACLE_ML_SERVER_URL is not set — skipping ML evaluation, scoring as uncertain");
      } else {
      const inferencePayload = {
        model_id: "latest_active",
        feature_vector: this.extractFeatures(context),
        context_metadata: context
      };

      const mlServerResponse = await fetch(`${ML_ORACLE_SERVER_URL}/v1/predict`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": ML_SERVER_API_KEY
          },
          body: JSON.stringify(inferencePayload),
          signal: AbortSignal.timeout(1500)
        });

        if (mlServerResponse.ok) {
          const inferenceResult = await mlServerResponse.json();
          botScore = inferenceResult.bot_probability || 0;

          if (botScore > 0.85) return this.finalize("BLOCK", "High Bot Probability", botScore);
          if (botScore > 0.50) return this.finalize("CHALLENGE", "Medium Bot Probability", botScore);
        } else {
          console.error(`WAF ML direct fetch failed: ${mlServerResponse.status}`);
        }
      }
    } catch (err) {
      console.error("ML evaluation failed during WAF check:", err);
      // Fail open if ML engine is unreachable
    }

    return this.finalize("ALLOW", "Clean Traffic", botScore);
  }

  private evaluateRuleCondition(condition: string, target: string, value: string, context: EvaluationContext): boolean {
    let targetValue = "";
    
    switch(target) {
      case "IP": targetValue = context.ip; break;
      case "USER_AGENT": targetValue = context.userAgent; break;
      case "GEOLOCATION": targetValue = context.countryCode || ""; break;
      case "PATH": targetValue = context.path; break;
      default: return false;
    }

    if (!targetValue) return false;

    switch(condition) {
      case "EQUALS": return targetValue === value;
      case "CONTAINS": return targetValue.includes(value);
      case "MATCHES_REGEX": {
        // 🔒 Sandbox: validate the regex pattern before using it.
        // Untrusted patterns from the DB can be malformed or cause ReDoS.
        try {
          // Basic length guard against catastrophic backtracking inputs
          if (value.length > 500) {
            console.warn(`[WAF] Regex pattern too long (${value.length} chars), skipping`);
            return false;
          }
          const re = new RegExp(value);
          // Enforce a short test timeout via a length-limited target
          const limited = targetValue.slice(0, 2048);
          return re.test(limited);
        } catch (e) {
          console.warn(`[WAF] Invalid regex pattern from DB: ${value}`, e);
          return false;
        }
      }
      default: return false;
    }
  }

  private extractFeatures(ctx: EvaluationContext): number[] {
    const hasSusHeaders = ctx.headers["x-forwarded-for"] && ctx.headers["via"] ? 1 : 0;
    const isHeadlessUa = /headless|phantom|puppeteer|selenium/i.test(ctx.userAgent) ? 1 : 0;
    const methodInt = ctx.method === "POST" ? 1 : ctx.method === "GET" ? 0 : 0.5;
    const uaLengthNormalized = Math.min(ctx.userAgent.length / 200, 1.0);
    return [hasSusHeaders, isHeadlessUa, methodInt, uaLengthNormalized, 0, 0, 0, 0];
  }

  private async logEvent(action: string, context: EvaluationContext, botScore: number, ruleId?: string) {
    const supabase = createAdminClient();
    await supabase.from("audit_logs").insert({
      ip_address: context.ip,
      user_agent: context.userAgent,
      action: action,
      bot_probability_score: botScore,
      rule_id: ruleId,
      path: context.path,
      method: context.method,
      country: context.countryCode,
      latency_ms: Date.now() - this.startTime
    });
  }

  private async finalize(action: EvaluationResult["action"], reason: string, botScore: number, ruleId?: string): Promise<EvaluationResult> {
    const latencyMs = Date.now() - this.startTime;
    return { action, reason, botScore, matchedRuleId: ruleId, latencyMs };
  }
}

export const Route = createFileRoute("/api/waf/evaluate")({
  server: {
    handlers: {
      POST: createSecureHandler(
        async ({ request }) => {
          // 🔒 Internal-only route — must be called by the Cloudflare Worker with the shared secret.
          const secretError = requireInternalSecret(request);
          if (secretError) return secretError;

          try {
            const context: EvaluationContext = await request.json();
            const engine = new AegisWafEngine();
            const result = await engine.evaluateRequest(context);

            // Asynchronous logging to avoid blocking response
            const siteUrl = process.env.VITE_SITE_URL;
            if (siteUrl) {
              fetch(`${siteUrl}/api/ml/async-log`, {
                method: 'POST', body: JSON.stringify({ context, result })
              }).catch(() => {});
            } else {
              console.warn("[WAF] VITE_SITE_URL missing, skipping async logging subrequest.");
            }

            return Response.json(result);
          } catch (error: any) {
            return Response.json({ error: error.message, action: "ALLOW" }, { status: 500 });
          }
        },
        { requireAuth: false } // 🔒 Handled via internal secret
      ),
    },
  },
});

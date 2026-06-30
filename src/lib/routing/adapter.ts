import { CoreRoutingRequest, RoutingDecision, detectDevice, evaluateRules } from "./core-router";
import { classifyTraffic } from "@/lib/ml/classifier";
import { Redis } from "@upstash/redis";
import { extractTraceContext } from "../telemetry/tracer";
import { emitTelemetryEvent } from "../telemetry/logger";
import { startTimer } from "../telemetry/metrics";

const BUCKET_CAPACITY = 100;
const LEAK_RATE_PER_SECOND = 10;
const RATE_LIMIT_KEY_PREFIX = 'rl:';
const LINK_CONFIG_KEY_PREFIX = 'link:';

const LEAKY_BUCKET_LUA = `
local key        = KEYS[1]
local capacity   = tonumber(ARGV[1])
local leak_rate  = tonumber(ARGV[2])
local now        = tonumber(ARGV[3])

local bucket     = redis.call("HMGET", key, "tokens", "last_update")
local tokens     = tonumber(bucket[1])
local last_ts    = tonumber(bucket[2])

if not tokens then
  tokens   = capacity
  last_ts  = now
end

local elapsed  = (now - last_ts) / 1000
local leaked   = elapsed * leak_rate
tokens = math.min(capacity, tokens + leaked)

if tokens >= 1 then
  tokens = tokens - 1
  redis.call("HMSET", key, "tokens", tokens, "last_update", now)
  redis.call("EXPIRE", key, math.ceil(capacity / leak_rate) + 10)
  return 1
else
  redis.call("HMSET", key, "tokens", tokens, "last_update", now)
  return 0
end
`;

export async function checkRateLimit(ip: string, now: number, traceCtx: any): Promise<boolean> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!upstashUrl || !upstashToken) {
    emitTelemetryEvent({ ...traceCtx, type: 'FailOpen', subsystem: 'redis', error: 'Missing Credentials' });
    return true; // Fail open if Redis is unconfigured
  }

  const redis = new Redis({ url: upstashUrl, token: upstashToken });
  const key = `${RATE_LIMIT_KEY_PREFIX}${ip}`;

  try {
    const result = await redis.eval(
      LEAKY_BUCKET_LUA,
      [key],
      [BUCKET_CAPACITY, LEAK_RATE_PER_SECOND, now]
    );
    return result === 1;
  } catch (error: any) {
    console.error("[RateLimit] Redis error:", error);
    emitTelemetryEvent({ ...traceCtx, type: 'FailOpen', subsystem: 'redis', error: error.message || 'Unknown Redis error' });
    return true; // Fail open
  }
}

export async function getLinkConfig(slug: string, traceCtx: any): Promise<any | null> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    emitTelemetryEvent({ ...traceCtx, type: 'FailOpen', subsystem: 'redis', error: 'Missing Credentials in Config Lookup' });
    return null;
  }

  const redis = new Redis({ url: upstashUrl, token: upstashToken });
  const key = `${LINK_CONFIG_KEY_PREFIX}${slug}`;

  try {
    const data = await redis.get(key);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch (error: any) {
    console.error("[LinkConfig] Redis error:", error);
    emitTelemetryEvent({ ...traceCtx, type: 'FailOpen', subsystem: 'redis', error: error.message || 'Config lookup failed' });
    return null;
  }
}

export async function processEdgeRoute(request: Request): Promise<Response | null> {
  const url = new URL(request.url);
  const traceCtx = extractTraceContext(request);

  // Exclude static assets, internal routes, and API routes
  if (
    url.pathname === "/" ||
    url.pathname.startsWith("/_") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.includes(".")
  ) {
    return null; // Passthrough to TanStack Start
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const slug = segments[0];
  if (!slug) return null;

  const RESERVED_PATHS = [
    "login", "signup", "dashboard", "analytics", "audit-logs", 
    "links", "ml-engine", "security", "settings", "rules", "docs"
  ];
  if (RESERVED_PATHS.includes(slug.toLowerCase())) {
    return null; // Passthrough
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "";
  const countryCode = request.headers.get("cf-ipcountry") || "UNKNOWN";
  const region = request.headers.get("cf-region") || "";
  const city = request.headers.get("cf-ipcity") || "";
  const now = Date.now();

  emitTelemetryEvent({
    ...traceCtx,
    type: 'EdgeEntry',
    path: url.pathname,
    ip,
    userAgent
  });

  const isAllowed = await checkRateLimit(ip, now, traceCtx);
  if (!isAllowed) {
    const retryAfter = Math.ceil(BUCKET_CAPACITY / LEAK_RATE_PER_SECOND);
    emitTelemetryEvent({ ...traceCtx, type: 'RateLimitBlock', ip });
    return Response.json(
      { error: "Too Many Requests", message: "Rate limit exceeded." },
      { 
        status: 429, 
        headers: { 
          "Retry-After": String(retryAfter),
          "X-Aegis-Blocked": "rate-limit"
        } 
      }
    );
  }

  let mlResult;
  const getMlDuration = startTimer();
  try {
    // Adapter bridging the Web API Request to our internal ML feature extractor which expects NextRequest-like shape.
    // The classifier uses request headers heavily, which we can mock if needed, but it accepts a standard Request.
    // Wrap in a 50ms timeout to ensure zero async blocking on edge routing.
    const mlPromise = classifyTraffic(request as any);
    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("ML Timeout")), 50));
    mlResult = await Promise.race([mlPromise, timeoutPromise]);
  } catch (err: any) {
    console.error("[EdgeRouter] ML error/timeout:", err);
    emitTelemetryEvent({ ...traceCtx, type: 'FailOpen', subsystem: 'ml', error: err.message || 'ML Classification failed' });
    mlResult = { score: 0.5, label: "uncertain", confidence: 0, features: {}, heuristicOverride: false } as any;
  }
  const mlDurationMs = getMlDuration();
  
  emitTelemetryEvent({
    ...traceCtx,
    type: 'MLClassification',
    durationMs: mlDurationMs,
    label: mlResult.label,
    score: mlResult.score,
    confidence: mlResult.confidence
  });

  if (mlResult.label === "bot" && mlResult.confidence >= 0.9) {
    return Response.json(
      { error: "Forbidden", message: "Automated traffic detected." },
      { status: 403, headers: { "X-Aegis-Blocked": "ml-high-confidence-bot" } }
    );
  }

  let config = null;
  const getConfigDuration = startTimer();
  try {
    config = await getLinkConfig(slug, traceCtx);
  } catch (err) {}
  const configDurationMs = getConfigDuration();

  if (!config) {
    return Response.redirect(new URL("/404", request.url));
  }

  if (!config.is_active) {
    const dest = config.not_found_url || "/404";
    return Response.redirect(new URL(dest, request.url));
  }

  const device = detectDevice(userAgent);
  let targetUrl = config.default_target_url;
  const matched = evaluateRules(config.redirect_rules || [], mlResult, countryCode, device, userAgent, new Date().getUTCHours());
  if (matched) {
    targetUrl = matched;
  }

  let finalUrl;
  try { finalUrl = new URL(targetUrl); } catch { finalUrl = new URL(config.default_target_url); }
  
  emitTelemetryEvent({
    ...traceCtx,
    type: 'RoutingDecision',
    slug,
    matchedRuleType: matched ? "rule" : null, // core-router evaluateRules only returns string, we infer rule type match
    targetUrl: finalUrl.toString(),
    configLookupDurationMs: configDurationMs
  });

  return Response.redirect(finalUrl, 302);
}

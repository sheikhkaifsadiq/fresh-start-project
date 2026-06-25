import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

// --- Configuration & Security ---
// In a real environment, these would be in environment variables:
// ORACLE_ML_SERVER_URL, ORACLE_API_KEY, VERCEL_HMAC_SECRET
const ML_SERVER_URL = process.env.ORACLE_ML_SERVER_URL || "https://ml-core.internal.aegis.router.com/api/v2";
const VERCEL_HMAC_SECRET = process.env.VERCEL_HMAC_SECRET || "fallback-dev-secret-do-not-use-in-prod";

// --- Schemas ---
const predictionRequestSchema = z.object({
  model: z.enum(['anomaly-detect-v4', 'threat-intel-feed', 'bot-heuristic']),
  payload: z.record(z.any()),
  metadata: z.object({
    source: z.string(),
    latency_budget_ms: z.number().optional().default(50),
  }).optional(),
});

/**
 * Generates an HMAC signature for secure Vercel -> Oracle communication
 * Prevents unauthorized access to the ML server even if the URL is known.
 */
function generateSignature(payload: string, timestamp: string): string {
  const hmac = crypto.createHmac('sha256', VERCEL_HMAC_SECRET);
  hmac.update(`${timestamp}.${payload}`);
  return hmac.digest('hex');
}

/**
 * Proxy Route for ML Processing
 * Vercel Edge/Serverless -> Oracle ARM64
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate Request
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized access to ML Proxy" }, { status: 401 });
    }
    // Verify bearer token here (usually Supabase Auth or internal service token)
    
    // 2. Parse & Validate Payload
    const rawBody = await req.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validationResult = predictionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "Schema validation failed", 
        issues: validationResult.error.issues 
      }, { status: 400 });
    }

    const { model, payload, metadata } = validationResult.data;

    // 3. Prepare Secure Request to Oracle Server
    const timestamp = Date.now().toString();
    const signature = generateSignature(rawBody, timestamp);

    // Enforce strict timeouts since Vercel serverless functions have execution limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), metadata?.latency_budget_ms || 100);

    let mlResponse;
    try {
      mlResponse = await fetch(`${ML_SERVER_URL}/predict/${model}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Aegis-Timestamp": timestamp,
          "X-Aegis-Signature": signature,
          // Propagate tracing headers if they exist
          "X-Request-Id": req.headers.get("x-request-id") || crypto.randomUUID(),
        },
        body: rawBody,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
         // Return a heuristic fallback if the Oracle ML server times out
         console.warn(`[ML-PROXY] Oracle ML Timeout for model ${model}. Falling back to heuristics.`);
         return NextResponse.json({
           fallback_used: true,
           result: {
             score: 0.1, // Default low risk on timeout to prevent blocking legitimate traffic
             confidence: 0.0,
             reason: "ml_timeout_fallback"
           },
           timing: { total_ms: Date.now() - startTime }
         });
      }
      throw fetchError;
    }

    // 4. Handle Oracle Response
    if (!mlResponse.ok) {
      const errorText = await mlResponse.text();
      console.error(`[ML-PROXY] Oracle Error ${mlResponse.status}:`, errorText);
      return NextResponse.json({ 
        error: "ML Inference Failed", 
        upstream_status: mlResponse.status 
      }, { status: 502 });
    }

    const resultData = await mlResponse.json();

    // 5. Return Enriched Response
    return NextResponse.json({
      success: true,
      result: resultData,
      timing: {
        total_ms: Date.now() - startTime,
        oracle_reported_ms: mlResponse.headers.get("X-Processing-Time-Ms") || null
      }
    });

  } catch (error: any) {
    console.error("[ML-PROXY] Unhandled Exception:", error);
    return NextResponse.json(
      { error: "Internal Server Error in ML Proxy", message: error.message },
      { status: 500 }
    );
  }
}

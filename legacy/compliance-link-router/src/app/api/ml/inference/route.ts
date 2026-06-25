// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/admin";
import crypto from "crypto";

const ML_ORACLE_SERVER_URL = process.env.ORACLE_ML_SERVER_URL || "http://10.0.0.5:8080";
const ML_SERVER_API_KEY = process.env.ORACLE_ML_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { features, modelId, context } = body;

    if (!features) {
      return NextResponse.json({ error: "Missing features array" }, { status: 400 });
    }

    // 1. Verify Authentication & Permissions
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Format Request for Oracle ARM64 Deep Learning Server
    const inferencePayload = {
      model_id: modelId || "latest_active",
      feature_vector: features,
      context_metadata: {
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
        client_app: "aegis_edge_router",
        ...context
      }
    };

    // 3. Dispatch to external ML Server via SSH tunnel / private networking
    const mlServerResponse = await fetch(`${ML_ORACLE_SERVER_URL}/v1/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": ML_SERVER_API_KEY || "",
        "X-Client-Timeout": "1000" // Strict 1s timeout for edge routing
      },
      body: JSON.stringify(inferencePayload),
      // Prevent long hanging requests holding up edge routing
      signal: AbortSignal.timeout(1500) 
    });

    if (!mlServerResponse.ok) {
      console.error(`Oracle ML Server Error: ${mlServerResponse.status}`);
      // Fallback response if ML server fails
      return NextResponse.json({ 
        bot_probability: 0.1, 
        fallback_used: true,
        reason: "ML_SERVER_UNAVAILABLE"
      });
    }

    const inferenceResult = await mlServerResponse.json();

    // 4. Log the inference to Supabase (Async, non-blocking if possible)
    const supabase = createClient();
    supabase.from("audit_logs").insert({
      action: "ML_EVALUATION",
      bot_probability_score: inferenceResult.bot_probability,
      metadata: {
        model_version: inferenceResult.model_version,
        latency_ms: inferenceResult.latency_ms,
        shap_values: inferenceResult.shap_values
      }
    }).then(() => console.log("Inference logged."));

    // 5. Return fast response to edge router
    return NextResponse.json({
      bot_probability: inferenceResult.bot_probability,
      threat_level: inferenceResult.threat_level,
      is_bot: inferenceResult.bot_probability > 0.85,
      shap_values: inferenceResult.shap_values,
      latency_ms: inferenceResult.latency_ms,
      model_version: inferenceResult.model_version
    });

  } catch (error: any) {
    console.error("ML Inference Edge Failure:", error);
    // In event of catastrophic failure, allow traffic to prevent outage
    return NextResponse.json({ 
      bot_probability: 0.0, 
      error: error.message,
      fallback_used: true 
    }, { status: 500 });
  }
}


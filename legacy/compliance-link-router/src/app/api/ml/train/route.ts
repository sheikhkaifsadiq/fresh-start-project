// @ts-nocheck
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/admin";

const ML_ORACLE_SERVER_URL = process.env.ORACLE_ML_SERVER_URL || "http://10.0.0.5:8080";
const ML_SERVER_API_KEY = process.env.ORACLE_ML_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { datasetId, hyperparams, architecture } = body;

    const supabase = createClient();

    // Check admin permissions
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Training Job in Supabase
    const { data: jobData, error: jobError } = await supabase
      .from("ml_training_jobs")
      .insert({
        status: "STARTING",
        hyperparams: hyperparams,
        architecture: architecture,
        dataset_id: datasetId,
        started_at: new Date().toISOString()
      })
      .select("id")
      .single();

    if (jobError) {
      return NextResponse.json({ error: "Failed to initialize training job" }, { status: 500 });
    }

    const jobId = jobData.id;

    // Trigger Heavy Compute on Oracle ARM64 Server
    // Fire and forget - the Oracle server will update Supabase directly via its own connection
    fetch(`${ML_ORACLE_SERVER_URL}/v1/train/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": ML_SERVER_API_KEY || "",
      },
      body: JSON.stringify({
        job_id: jobId,
        hyperparams: hyperparams,
        architecture: architecture,
        dataset_target: datasetId,
        supabase_webhook: `${process.env.NEXT_PUBLIC_SITE_URL}/api/ml/webhook/training_update`
      })
    }).catch(err => console.error("Failed to signal Oracle server:", err));

    return NextResponse.json({
      success: true,
      jobId: jobId,
      message: "Training job successfully dispatched to compute cluster."
    });

  } catch (error: any) {
    console.error("Training Trigger Failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


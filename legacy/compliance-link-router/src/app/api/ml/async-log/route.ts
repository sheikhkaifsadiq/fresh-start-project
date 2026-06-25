import { NextResponse } from "next/server";

const ML_ORACLE_SERVER_URL = process.env.ORACLE_ML_SERVER_URL || "http://10.0.0.5:8080";
const ML_SERVER_API_KEY = process.env.ORACLE_ML_API_KEY;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { context, result } = body;

    // Send the raw request context AND the rule-engine's decision to the Oracle ML Server
    // This allows the neural network to train continuously on EVERY request (both bots and humans)
    fetch(`${ML_ORACLE_SERVER_URL}/v1/train/continuous`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": ML_SERVER_API_KEY || "",
      },
      body: JSON.stringify({
        ip: context.ip,
        user_agent: context.userAgent,
        path: context.path,
        method: context.method,
        headers: context.headers,
        country: context.countryCode,
        waf_action: result.action,
        waf_reason: result.reason,
        bot_score_assigned: result.botScore,
        timestamp: new Date().toISOString()
      })
    }).catch(err => console.error("Failed to stream data to Oracle server for continuous training:", err));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

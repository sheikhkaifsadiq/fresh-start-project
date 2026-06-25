/**
 * @file src/lib/audit-logger.server.ts
 * @description Audit logging service (server-only). Mirrors the legacy
 * src/lib/audit-logger.ts interface 1:1 so existing handlers compile
 * unchanged. Writes go to the `audit_logs` table via the admin client.
 */

import { createAdminClient } from "@/lib/supabase/admin.server";

export const AuditEventType = {
  USER_LOGIN_SUCCESS: "USER_LOGIN_SUCCESS",
  USER_LOGIN_FAILED: "USER_LOGIN_FAILED",
  USER_SIGNUP: "USER_SIGNUP",
  USER_LOGOUT: "USER_LOGOUT",
  LINK_CREATED: "LINK_CREATED",
  LINK_UPDATED: "LINK_UPDATED",
  LINK_DELETED: "LINK_DELETED",
  RULE_CREATED: "RULE_CREATED",
  RULE_UPDATED: "RULE_UPDATED",
  RULE_DELETED: "RULE_DELETED",
  ML_MODEL_DEPLOYED: "ML_MODEL_DEPLOYED",
  ML_MODEL_UPDATED: "ML_MODEL_UPDATED",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  ASSET_UPLOADED: "ASSET_UPLOADED",
  UNAUTHORIZED_ACCESS: "UNAUTHORIZED_ACCESS",
} as const;

export type AuditEventTypeValue = (typeof AuditEventType)[keyof typeof AuditEventType];

export const USER_LOGIN_SUCCESS = AuditEventType.USER_LOGIN_SUCCESS;
export const USER_LOGIN_FAILED = AuditEventType.USER_LOGIN_FAILED;
export const USER_SIGNUP = AuditEventType.USER_SIGNUP;
export const USER_LOGOUT = AuditEventType.USER_LOGOUT;
export const LINK_CREATED = AuditEventType.LINK_CREATED;
export const LINK_UPDATED = AuditEventType.LINK_UPDATED;
export const LINK_DELETED = AuditEventType.LINK_DELETED;
export const RULE_CREATED = AuditEventType.RULE_CREATED;
export const RULE_UPDATED = AuditEventType.RULE_UPDATED;
export const RULE_DELETED = AuditEventType.RULE_DELETED;
export const ML_MODEL_DEPLOYED = AuditEventType.ML_MODEL_DEPLOYED;
export const ML_MODEL_UPDATED = AuditEventType.ML_MODEL_UPDATED;
export const RATE_LIMIT_EXCEEDED = AuditEventType.RATE_LIMIT_EXCEEDED;
export const ASSET_UPLOADED = AuditEventType.ASSET_UPLOADED;
export const UNAUTHORIZED_ACCESS = AuditEventType.UNAUTHORIZED_ACCESS;

export interface AuditLogDetails {
  [key: string]: unknown;
}

export async function logEvent(
  userId: string | null,
  eventType: AuditEventTypeValue,
  details: AuditLogDetails = {},
  ipAddress: string | null = null,
): Promise<void> {
  try {
    const admin = createAdminClient() as unknown as {
      from: (table: string) => { insert: (row: unknown) => Promise<unknown> };
    };
    await admin.from("audit_logs").insert({
      user_id: userId,
      event_type: eventType,
      details,
      ip_address: ipAddress,
    });
  } catch (err) {
    console.error("[audit-logger] Failed to write audit event:", err);
  }
}

export function extractIpAddress(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

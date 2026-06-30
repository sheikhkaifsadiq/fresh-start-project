/**
 * @file src/lib/auth/rbac.server.ts
 * @description Role-Based Access Control (RBAC) middleware for TanStack Start APIs.
 */

import { requireAuth } from "./api-auth.server";

export type Role = 'user' | 'admin' | 'security_admin' | 'billing_admin';

export const ROLE_HIERARCHY: Record<Role, number> = {
  user: 10,
  billing_admin: 20,
  security_admin: 30,
  admin: 100, // Superadmin
};

export interface AuthContext {
  userId: string;
  role: Role;
}

export interface AuthResult {
  userId?: string;
  role?: Role;
  error?: Response;
}

/**
 * Ensures the authenticated user has one of the allowed roles.
 * Falls back to 'user' if no role is found.
 */
export async function requireRole(request: Request, allowedRoles: Role[]): Promise<AuthResult> {
  const { userId, error } = await requireAuth(request);
  if (error || !userId) {
    return { error };
  }

  // To get the role, we decode the JWT (from Authorization header or cookie)
  // requireAuth uses Supabase admin client to verify the token, but we need the user details.
  // We can fetch the user details using the token.
  
  const authHeader = request.headers.get("authorization");
  let token = "";
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else {
    // If we're relying on cookies for auth (handled inside requireAuth), we might not have a Bearer token easily accessible here without duplicating logic.
    // However, for API routes, Bearer tokens are standard.
  }

  if (!token) {
     return { error: Response.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }

  const { createAdminClient } = await import('@/lib/supabase/admin.server');
  const admin = createAdminClient();
  const { data: userData, error: userError } = await admin.auth.getUser(token);

  if (userError || !userData?.user) {
    return { error: Response.json({ success: false, message: 'Invalid token' }, { status: 401 }) };
  }

  const user = userData.user;
  const userRoleStr = (user.app_metadata?.role || user.user_metadata?.role || 'user') as string;
  const role = (ROLE_HIERARCHY[userRoleStr as Role] !== undefined ? userRoleStr : 'user') as Role;

  if (!allowedRoles.includes(role) && role !== 'admin') {
    // 'admin' implicitly has all roles unless strictly checking permissions
    return { error: Response.json({ success: false, message: 'Forbidden: Insufficient privileges.' }, { status: 403 }) };
  }

  return { userId: user.id, role };
}

/**
 * Ensures the authenticated user has at least the specified minimum role hierarchy level.
 */
export async function requireMinimumRole(request: Request, minRole: Role): Promise<AuthResult> {
  const authResult = await requireRole(request, ['user', 'billing_admin', 'security_admin', 'admin']);
  if (authResult.error || !authResult.role) return authResult;

  const userLevel = ROLE_HIERARCHY[authResult.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minRole] || 100;

  if (userLevel < requiredLevel) {
    return { error: Response.json({ success: false, message: 'Forbidden: Insufficient privileges.' }, { status: 403 }) };
  }

  return authResult;
}

/**
 * @file src/components/auth/AuthProvider.tsx
 * @description Client component that initializes Zustand auth state on mount
 * and subscribes to Supabase's onAuthStateChange event to keep the store
 * in sync with the actual auth session throughout the app lifetime.
 */

"use client";

import { useEffect, useRef } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useAuthStore, supabase } from "@/lib/stores/auth-store";
import type { AuthUser } from "@/lib/stores/auth-store";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Helper — mirrors the one in auth-store to avoid circular deps
// ---------------------------------------------------------------------------
function mapSupabaseUser(supabaseUser: SupabaseUser): AuthUser {
  const meta = supabaseUser.user_metadata ?? {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? "",
    fullName:
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      null,
    avatarUrl: (meta.avatar_url as string | undefined) ?? null,
    role: (supabaseUser.role as string | undefined) ?? "authenticated",
    createdAt: supabaseUser.created_at,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider
 *
 * Wrap your root layout (or any subtree) with this component.
 * It:
 *  1. Calls `initialize()` on first mount to restore an existing session.
 *  2. Subscribes to Supabase's real-time auth changes (sign-in, sign-out,
 *     token refresh) and mirrors those changes into the Zustand store.
 *  3. Cleans up the subscription on unmount.
 *
 * Usage:
 * ```tsx
 * // src/app/layout.tsx
 * import { AuthProvider } from "@/components/auth/AuthProvider";
 * export default function RootLayout({ children }) {
 *   return <AuthProvider>{children}</AuthProvider>;
 * }
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((s) => s.initialize);
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  // Guard against double-initialization in React Strict Mode
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      initialize();
    }

    // Subscribe to Supabase auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
          case "USER_UPDATED": {
            if (session?.user) {
              setSession(session);
              setUser(mapSupabaseUser(session.user));
            }
            break;
          }
          case "SIGNED_OUT": {
            clearAuth();
            break;
          }
          case "INITIAL_SESSION": {
            // Handled by initialize(); nothing extra needed here
            setLoading(false);
            break;
          }
          default:
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export default AuthProvider;

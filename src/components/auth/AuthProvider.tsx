/**
 * @file src/components/auth/AuthProvider.tsx
 * @description Initializes auth on mount and keeps the Zustand store in sync
 * with Supabase's auth state. Mounted once from the root route.
 */

import { useEffect, useRef } from "react";
import type { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js";
import { useAuthStore, supabase } from "@/lib/stores/auth-store";
import type { AuthUser } from "@/lib/stores/auth-store";

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

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const initialize = useAuthStore((s) => s.initialize);
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setLoading = useAuthStore((s) => s.setLoading);

  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      void initialize();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
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
          setLoading(false);
          break;
        }
        default:
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export default AuthProvider;

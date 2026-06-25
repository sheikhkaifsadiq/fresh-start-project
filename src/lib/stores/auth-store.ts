/**
 * @file src/lib/stores/auth-store.ts
 * @description Zustand auth store ported from the legacy product. Uses the
 * browser Supabase client and the same /api/v1/auth/* contract.
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

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

const defaultState: AuthState = {
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        ...defaultState,

        setUser: (user) =>
          set({ user, isAuthenticated: user !== null }, false, "auth/setUser"),
        setSession: (session) => set({ session }, false, "auth/setSession"),
        setLoading: (isLoading) => set({ isLoading }, false, "auth/setLoading"),
        setError: (error) => set({ error }, false, "auth/setError"),
        clearAuth: () => set({ ...defaultState }, false, "auth/clearAuth"),

        login: async (email, password) => {
          set({ isLoading: true, error: null }, false, "auth/login/pending");
          try {
            const response = await fetch("/api/v1/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
              credentials: "include",
            });
            const data = await response.json();
            if (!response.ok || !data?.success) {
              throw new Error(data?.message ?? data?.error ?? "Login failed.");
            }

            // Mirror the session into the browser Supabase client so
            // onAuthStateChange and admin-less RLS reads work.
            const session = data.data.session;
            if (session?.accessToken && session?.refreshToken) {
              await supabase.auth.setSession({
                access_token: session.accessToken,
                refresh_token: session.refreshToken,
              });
            }

            const { data: { session: liveSession } } = await supabase.auth.getSession();
            if (liveSession?.user) {
              set(
                {
                  session: liveSession,
                  user: mapSupabaseUser(liveSession.user),
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                },
                false,
                "auth/login/fulfilled",
              );
            } else {
              set({ isLoading: false }, false, "auth/login/no-session");
            }
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "An unexpected error occurred.";
            set({ isLoading: false, error: message }, false, "auth/login/rejected");
            throw err;
          }
        },

        logout: async () => {
          set({ isLoading: true }, false, "auth/logout/pending");
          try {
            await fetch("/api/v1/auth/logout", { method: "POST", credentials: "include" });
            await supabase.auth.signOut();
          } finally {
            set({ ...defaultState }, false, "auth/logout/fulfilled");
          }
        },

        initialize: async () => {
          set({ isLoading: true }, false, "auth/initialize/pending");
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            if (session?.user) {
              set(
                {
                  session,
                  user: mapSupabaseUser(session.user),
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                },
                false,
                "auth/initialize/fulfilled",
              );
            } else {
              set({ ...defaultState, isLoading: false }, false, "auth/initialize/unauthenticated");
            }
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to restore session.";
            set({ ...defaultState, isLoading: false, error: message }, false, "auth/initialize/rejected");
          }
        },
      }),
      {
        name: "aegis-route-auth",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: "AegisRouteAuthStore" },
  ),
);

export { supabase };

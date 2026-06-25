/**
 * @file src/lib/stores/auth-store.ts
 * @description Complete Zustand auth store for Aegis Route.
 * Manages user/session state, async login/logout, and session initialization
 * from Supabase. All side-effects are isolated to action creators.
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { createClient } from "@supabase/supabase-js";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase client (singleton, safe to call in browser)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : 'https://dummy.supabase.co';

const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

/** Normalized user object stored in Zustand (subset of Supabase User). */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

/** Shape of the complete auth slice. */
export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/** All synchronous and asynchronous actions exposed by the store. */
export interface AuthActions {
  /** Replace the stored user (pass null to clear). */
  setUser: (user: AuthUser | null) => void;
  /** Replace the stored session. */
  setSession: (session: Session | null) => void;
  /** Toggle the loading flag. */
  setLoading: (isLoading: boolean) => void;
  /** Set an error message (null to clear). */
  setError: (error: string | null) => void;
  /** Reset everything to unauthenticated state. */
  clearAuth: () => void;
  /**
   * Async login action.
   * Calls POST /api/v1/auth/login which in turn calls Supabase signInWithPassword.
   * On success the store is hydrated with user + session.
   */
  login: (email: string, password: string) => Promise<void>;
  /** Async logout action — signs out from Supabase and clears local state. */
  logout: () => Promise<void>;
  /**
   * Should be called once on app bootstrap (e.g. inside AuthProvider).
   * Reads the current Supabase session from the browser's cookie/storage
   * and populates the store accordingly.
   */
  initialize: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a raw Supabase User → our AuthUser shape. */
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
// Default state
// ---------------------------------------------------------------------------

const defaultState: AuthState = {
  user: null,
  session: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,
};

// ---------------------------------------------------------------------------
// Store definition
// ---------------------------------------------------------------------------

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, _get) => ({
        // ---- initial state -------------------------------------------------
        ...defaultState,

        // ---- synchronous actions ------------------------------------------

        setUser: (user) =>
          set(
            { user, isAuthenticated: user !== null },
            false,
            "auth/setUser"
          ),

        setSession: (session) =>
          set({ session }, false, "auth/setSession"),

        setLoading: (isLoading) =>
          set({ isLoading }, false, "auth/setLoading"),

        setError: (error) =>
          set({ error }, false, "auth/setError"),

        clearAuth: () =>
          set(
            { ...defaultState },
            false,
            "auth/clearAuth"
          ),

        // ---- async actions ------------------------------------------------

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

            if (!response.ok) {
              throw new Error(
                (data as { error?: string }).error ??
                  "Login failed. Please try again."
              );
            }

            const { session, user: rawUser } = data as {
              session: Session;
              user: SupabaseUser;
            };

            set(
              {
                session,
                user: mapSupabaseUser(rawUser),
                isAuthenticated: true,
                isLoading: false,
                error: null,
              },
              false,
              "auth/login/fulfilled"
            );
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "An unexpected error occurred.";
            set(
              { isLoading: false, error: message },
              false,
              "auth/login/rejected"
            );
            throw err; // re-throw so page components can catch if needed
          }
        },

        logout: async () => {
          set({ isLoading: true }, false, "auth/logout/pending");
          try {
            await supabase.auth.signOut();
          } finally {
            set({ ...defaultState }, false, "auth/logout/fulfilled");
          }
        },

        initialize: async () => {
          set({ isLoading: true }, false, "auth/initialize/pending");

          try {
            const {
              data: { session },
              error,
            } = await supabase.auth.getSession();

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
                "auth/initialize/fulfilled"
              );
            } else {
              set(
                { ...defaultState, isLoading: false },
                false,
                "auth/initialize/unauthenticated"
              );
            }
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Failed to restore session.";
            set(
              { ...defaultState, isLoading: false, error: message },
              false,
              "auth/initialize/rejected"
            );
          }
        },
      }),
      {
        name: "aegis-route-auth",
        // Only persist the non-sensitive state slices.
        // The session token is managed by Supabase's own storage, not here.
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "AegisRouteAuthStore" }
  )
);

/** Expose the raw Supabase client for use in AuthProvider's subscription. */
export { supabase };

/**
 * @file src/components/auth/ProtectedRoute.tsx
 * @description Client-side route guard for authenticated pages.
 * Reads Zustand auth state; if the user is not authenticated it redirects to
 * /login. Shows an animated loading skeleton while auth is initializing.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md space-y-4 px-6">
        {/* Pulsing logo placeholder */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse" />
        </div>
        {/* Card skeleton */}
        <div className="rounded-xl border border-border bg-card/50 backdrop-blur-xl p-8 space-y-4">
          <div className="h-6 w-3/4 rounded-md bg-muted animate-pulse" />
          <div className="h-4 w-1/2 rounded-md bg-muted animate-pulse" />
          <div className="space-y-3 pt-4">
            <div className="h-10 rounded-md bg-muted animate-pulse" />
            <div className="h-10 rounded-md bg-muted animate-pulse" />
            <div className="h-10 rounded-md bg-muted/60 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ProtectedRouteProps {
  /** The protected page / subtree. */
  children: React.ReactNode;
  /**
   * Optional override for the redirect path when unauthenticated.
   * Defaults to "/login".
   */
  redirectTo?: string;
}

/**
 * ProtectedRoute
 *
 * Wrap any page or layout that requires authentication:
 *
 * ```tsx
 * // src/app/(dashboard)/layout.tsx
 * import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
 *
 * export default function DashboardLayout({ children }) {
 *   return <ProtectedRoute>{children}</ProtectedRoute>;
 * }
 * ```
 *
 * Behaviour:
 * - While `isLoading` is true  → renders a pulsing skeleton so there's no
 *   flash of unauthenticated content.
 * - When `isLoading` is false AND `isAuthenticated` is false → redirects to
 *   `redirectTo` (default: "/login").
 * - When `isAuthenticated` is true → renders `children` normally.
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);

  // While Supabase session is being restored, show skeleton
  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  // Not yet redirected but unauthenticated — keep rendering skeleton to
  // avoid a flash of protected content before the router.replace fires.
  if (!isAuthenticated) {
    return <AuthLoadingSkeleton />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;

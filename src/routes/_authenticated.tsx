/**
 * @file src/routes/_authenticated.tsx
 * @description Layout route that gates the entire dashboard area behind
 * the auth store. Unauthenticated users are bounced to /auth.
 */

import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

export const Route = createFileRoute("/_authenticated")({
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      void navigate({ to: "/auth" });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="auth-gate">
        <span className="kicker">Authorising session…</span>
      </div>
    );
  }

  return <Outlet />;
}

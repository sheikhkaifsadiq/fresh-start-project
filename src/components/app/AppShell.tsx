/**
 * @file src/components/app/AppShell.tsx
 * @description Authenticated application shell — sidebar + topbar + content
 * area. Reuses the landing page's editorial design language: ivory paper,
 * Fraunces display, IBM Plex Mono labels, charcoal ink, RoutingField ambient.
 */

import { type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/auth-store";

interface NavItem {
  to: string;
  label: string;
  group: "core" | "ops" | "system";
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", group: "core" },
  { to: "/links", label: "Links", group: "core" },
  { to: "/analytics", label: "Analytics", group: "core" },
  { to: "/rules", label: "Rules", group: "ops" },
  { to: "/security", label: "Security", group: "ops" },
  { to: "/ml-engine", label: "ML Engine", group: "ops" },
  { to: "/audit-logs", label: "Audit Logs", group: "system" },
  { to: "/settings", label: "Settings", group: "system" },
  { to: "/docs", label: "Docs", group: "system" },
];

export function AppShell({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/" });
  };

  const groups: Record<NavItem["group"], string> = {
    core: "Operate",
    ops: "Intelligence",
    system: "System",
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to="/dashboard" className="app-brand">
          <span className="app-brand-mark" aria-hidden />
          <span className="app-brand-text">AegisRoute</span>
        </Link>

        <nav className="app-nav">
          {(Object.keys(groups) as NavItem["group"][]).map((g) => (
            <div key={g} className="app-nav-group">
              <div className="app-nav-label">{groups[g]}</div>
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = location.pathname === n.to || location.pathname.startsWith(n.to + "/");
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`app-nav-link${active ? " is-active" : ""}`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="app-sidebar-foot">
          <div className="app-user">
            <div className="app-user-email" title={user?.email ?? ""}>
              {user?.fullName ?? user?.email ?? "—"}
            </div>
            <div className="app-user-role">{user?.role ?? "guest"}</div>
          </div>
          <button className="app-signout" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div>
            {kicker ? <div className="kicker">{kicker}</div> : null}
            <h1 className="app-title">{title}</h1>
          </div>
          <div className="app-topbar-meta">
            <span>· edge · live ·</span>
          </div>
        </header>

        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}

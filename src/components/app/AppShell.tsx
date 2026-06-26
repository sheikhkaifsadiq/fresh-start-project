/**
 * @file src/components/app/AppShell.tsx
 * @description Authenticated application shell — sidebar + topbar + content.
 * Sidebar collapses into a slide-over drawer on tablet / mobile via a
 * hamburger trigger in the topbar. Closes on route change and ESC.
 */

import { useEffect, useState, type ReactNode } from "react";
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
  { to: "/audit-logs", label: "Audit", group: "system" },
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
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Lock body scroll while drawer is open; close on ESC
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

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
    <div className={`app-shell${open ? " is-drawer-open" : ""}`}>
      <button
        className="app-scrim"
        aria-hidden={!open}
        tabIndex={-1}
        onClick={() => setOpen(false)}
      />
      <aside className="app-sidebar" aria-label="Primary">
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
          <button
            className="app-menu-btn"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
          <div className="app-topbar-title">
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

/**
 * @file src/components/app/mobile/MobileAppShell.tsx
 * @description Phone-native authenticated shell. Not a hidden sidebar:
 * a real mobile information architecture.
 *
 *   - Compact sticky topbar with title + overflow drawer (account,
 *     less-used pages like Audit, ML Engine, Settings, Docs).
 *   - Bottom tab bar with the five primary destinations
 *     (Home, Links, Analytics, Rules, Security). Always thumb-reach.
 *   - Body uses the same ds-* primitives as desktop. Those primitives
 *     already collapse hero / split / grid to single column ≤900px and
 *     turn tables into card-stacks, so page bodies need no edits.
 */

import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/stores/auth-store";

const PRIMARY = [
  { to: "/dashboard", label: "Home",      icon: "■" },
  { to: "/links",     label: "Links",     icon: "↗" },
  { to: "/analytics", label: "Analytics", icon: "≋" },
  { to: "/rules",     label: "Rules",     icon: "⌥" },
  { to: "/security",  label: "Security",  icon: "◈" },
] as const;

const OVERFLOW = [
  { to: "/ml-engine",  label: "ML Engine" },
  { to: "/audit-logs", label: "Audit log" },
  { to: "/settings",   label: "Settings" },
  { to: "/docs",       label: "Docs" },
] as const;

export function MobileAppShell({
  title, kicker, children,
}: { title: string; kicker?: string; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const onLogout = async () => { await logout(); navigate({ to: "/" }); };
  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <div className="mas-root">
      <header className="mas-top">
        <Link to="/dashboard" className="mas-brand">AegisRoute</Link>
        <button
          className="mas-more"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <span /><span /><span />
        </button>
      </header>

      <section className="mas-title-block">
        {kicker ? <div className="mas-kicker">{kicker}</div> : null}
        <h1 className="mas-title">{title}</h1>
      </section>

      <main className="mas-content">{children}</main>

      <nav className="mas-tabs" aria-label="Primary">
        {PRIMARY.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className={`mas-tab${isActive(t.to) ? " is-active" : ""}`}
          >
            <span className="mas-tab-icon" aria-hidden>{t.icon}</span>
            <span className="mas-tab-label">{t.label}</span>
          </Link>
        ))}
      </nav>

      <div
        className={`mas-drawer ${open ? "is-open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        <aside
          className="mas-drawer-panel"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="mas-drawer-head">
            <div>
              <div className="mas-drawer-eyebrow">Signed in as</div>
              <div className="mas-drawer-user" title={user?.email ?? ""}>
                {user?.fullName ?? user?.email ?? "—"}
              </div>
              <div className="mas-drawer-role">{user?.role ?? "operator"}</div>
            </div>
            <button className="mas-drawer-close" aria-label="Close menu" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="mas-drawer-section">More</div>
          <nav className="mas-drawer-nav">
            {OVERFLOW.map((o) => (
              <Link key={o.to} to={o.to} className={isActive(o.to) ? "is-active" : ""}>
                {o.label}
              </Link>
            ))}
          </nav>

          <button className="mas-signout" onClick={onLogout}>Sign out</button>
        </aside>
      </div>
    </div>
  );
}

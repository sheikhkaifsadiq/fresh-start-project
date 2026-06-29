/**
 * @file src/routes/_authenticated/settings.tsx
 * @description Settings layout — workspace, profile, API keys, notifications.
 * Tab navigation in-page, content composed of ds-* primitives.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { useAuthStore } from "@/lib/stores/auth-store";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — AegisRoute" }] }),
  component: SettingsPage,
});

const TABS = ["Profile", "Workspace", "API Keys", "Notifications", "Billing"] as const;
type Tab = (typeof TABS)[number];

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("Profile");
  return (
    <AppShell title="Settings." kicker="WORKSPACE · IDENTITY · ACCESS">
      <div className="ds-tabs">
        {TABS.map((t) => (
          <button key={t} className={`ds-tab${t === tab ? " is-active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Profile"       && <ProfileTab />}
      {tab === "Workspace"     && <WorkspaceTab />}
      {tab === "API Keys"      && <ApiKeysTab />}
      {tab === "Notifications" && <NotificationsTab />}
      {tab === "Billing"       && <BillingTab />}
    </AppShell>
  );
}

function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  return (
    <div className="ds-stack">
      <header>
        <div className="ds-kicker">Identity</div>
        <h2 className="ds-section-title">How you appear to your team.</h2>
      </header>
      <div className="ds-grid-2">
        <div className="ds-field">
          <label className="ds-field-label">Full name</label>
          <input className="ds-input" defaultValue={user?.fullName ?? ""} />
        </div>
        <div className="ds-field">
          <label className="ds-field-label">Email</label>
          <input className="ds-input" defaultValue={user?.email ?? ""} disabled />
          <span className="ds-field-help">Contact support to change the address on file.</span>
        </div>
        <div className="ds-field">
          <label className="ds-field-label">Role</label>
          <input className="ds-input" defaultValue={user?.role ?? "operator"} disabled />
        </div>
        <div className="ds-field">
          <label className="ds-field-label">Timezone</label>
          <select className="ds-select" defaultValue="UTC">
            <option>UTC</option><option>America/New_York</option><option>Europe/London</option><option>Asia/Tokyo</option>
          </select>
        </div>
      </div>
      <div className="ds-action-bar"><button className="ds-btn">Save profile</button></div>
    </div>
  );
}

function WorkspaceTab() {
  return (
    <div className="ds-stack">
      <header>
        <div className="ds-kicker">Workspace</div>
        <h2 className="ds-section-title">Shared configuration.</h2>
      </header>
      <dl className="ds-defs">
        <div><dt>Workspace name</dt><dd>AegisRoute · Default</dd></div>
        <div><dt>Workspace ID</dt><dd>ws_01HXYZAA9KQ2K8E7</dd></div>
        <div><dt>Plan</dt><dd>Edge · unlimited verdicts</dd></div>
        <div><dt>Region pinning</dt><dd>Auto · 38 regions</dd></div>
        <div><dt>Custom domain</dt><dd>Not configured</dd></div>
      </dl>
    </div>
  );
}

function ApiKeysTab() {
  return (
    <div className="ds-stack">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div className="ds-kicker">Programmatic access</div>
          <h2 className="ds-section-title">API keys.</h2>
        </div>
        <button className="ds-btn">+ New key</button>
      </header>
      <div className="ds-empty">
        <div className="ds-empty-title">No keys yet.</div>
        <div className="ds-empty-note">
          API keys grant programmatic access to issue links and read verdicts.
          Each key is scoped, rate-limited, and immediately revocable.
        </div>
        <button className="ds-btn ds-btn-ghost">Issue first key</button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const items = [
    { k: "Block-rate spike",  v: "Email + Slack", on: true },
    { k: "New API key issued", v: "Email",         on: true },
    { k: "Model promoted",     v: "Slack",         on: false },
    { k: "Region degraded",    v: "Email + SMS",   on: true },
    { k: "Weekly digest",      v: "Email",         on: true },
  ];
  return (
    <div className="ds-stack">
      <header>
        <div className="ds-kicker">Channels</div>
        <h2 className="ds-section-title">When we should reach you.</h2>
      </header>
      <ul className="ds-status">
        {items.map((i) => (
          <li key={i.k}>
            <span className={`ds-dot ds-dot-${i.on ? "ok" : "off"}`} aria-hidden />
            <span className="ds-status-k">{i.k}</span>
            <span className="ds-status-v">{i.on ? i.v : "off"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="ds-stack">
      <header>
        <div className="ds-kicker">Billing</div>
        <h2 className="ds-section-title">Your plan.</h2>
      </header>
      <section className="ds-hero">
        <div className="ds-hero-l">
          <div className="ds-kicker">Current plan</div>
          <div className="ds-hero-figure">
            <span className="ds-hero-num">Edge</span>
            <span className="ds-hero-unit">$0 / mo</span>
          </div>
          <p className="ds-hero-note">Unmetered verdicts during the open beta.</p>
        </div>
        <dl className="ds-hero-side">
          <div className="ds-side-row"><dt>Verdicts · MTD</dt><dd>0</dd></div>
          <div className="ds-side-row"><dt>Bandwidth</dt><dd>0 GB</dd></div>
          <div className="ds-side-row"><dt>Seats</dt><dd>1 / ∞</dd></div>
          <div className="ds-side-row"><dt>Renews</dt><dd>—</dd></div>
        </dl>
      </section>
    </div>
  );
}

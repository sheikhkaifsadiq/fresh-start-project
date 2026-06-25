/**
 * @file src/components/links/LinksManager.tsx
 * @description Container for the Links module. Mirrors the legacy
 * LinksManagerClient tab structure (Inventory · Bulk · QR · Routing),
 * but only the Inventory tab is wired in this phase — the remaining
 * tabs reuse the legacy components conceptually (kept untouched in
 * /legacy) and currently show a "next migration phase" placeholder so
 * the navigation contract is preserved without showing stale UI.
 */

import { useState } from "react";
import { Mask, Kinetic } from "@/lib/motion";
import { LinksTable } from "./LinksTable";
import { CreateLinkPanel } from "./CreateLinkPanel";
import { RuleBuilder } from "./RuleBuilder";

type Tab = "inventory" | "routing" | "bulk" | "qr";

const TABS: { id: Tab; label: string; desc: string }[] = [
  { id: "inventory", label: "Inventory", desc: "Every routed pathway you own." },
  { id: "routing",   label: "Routing",   desc: "Conditional logic graph." },
  { id: "bulk",      label: "Bulk",      desc: "CSV ingestion." },
  { id: "qr",        label: "QR",        desc: "Dynamic codes." },
];

export function LinksManager() {
  const [tab, setTab] = useState<Tab>("inventory");
  const [panelOpen, setPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <section className="lk-wrap">
      <header className="lk-header">
        <div className="kicker">Pathway command</div>
        <h1 className="lk-title">
          <Kinetic text="Links, observed in motion." stagger={0.04} />
        </h1>
        <Mask delay={120}>
          <p className="lk-sub">
            One ledger for every routed link. Inspect, gate, retire — without leaving the system.
          </p>
        </Mask>
      </header>

      <nav className="lk-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === tab}
            className={`lk-tab ${t.id === tab ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="lk-tab-label">{t.label}</span>
            <span className="lk-tab-desc">{t.desc}</span>
          </button>
        ))}
      </nav>

      <div className="lk-stage" key={tab}>
        {tab === "inventory" ? (
          <LinksTable
            refreshKey={refreshKey}
            onCreate={() => setPanelOpen(true)}
          />
        ) : tab === "routing" ? (
          <RuleBuilder />
        ) : (
          <div className="lk-soon">
            <div className="kicker">{active.label}</div>
            <h3>{active.desc}</h3>
            <p>
              This surface migrates next. The underlying logic, Supabase tables, and
              Oracle ML endpoints from the legacy app remain the source of truth.
            </p>
          </div>
        )}
      </div>

      <CreateLinkPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreated={() => setRefreshKey((k) => k + 1)}
      />
    </section>
  );
}

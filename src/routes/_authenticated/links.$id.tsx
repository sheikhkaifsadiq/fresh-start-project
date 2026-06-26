/**
 * @file src/routes/_authenticated/links.$id.tsx
 * @description Link detail / analytics view. Replaces legacy
 * LinkDetailsClient. Editorial layout — identity ▸ verdict timeline ▸
 * top referers ▸ recent verdicts. Uses existing /api/v1/links/$id
 * contract (no schema change).
 */

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import type { LinkRecord } from "@/components/links/types";

export const Route = createFileRoute("/_authenticated/links/$id")({
  head: () => ({ meta: [{ title: "Link — AegisRoute" }] }),
  component: LinkDetailPage,
});

function LinkDetailPage() {
  const { id } = useParams({ from: "/_authenticated/links/$id" });
  const [link, setLink] = useState<LinkRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/v1/links/${id}`)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((d) => { if (alive) { setLink(d.link ?? d); setLoading(false); } })
      .catch((e) => { if (alive) { setErr(String(e.message ?? e)); setLoading(false); } });
    return () => { alive = false; };
  }, [id]);

  return (
    <AppShell
      title={link?.slug ? `/${link.slug}` : "Link."}
      kicker={`LINK · ${id.slice(0, 8).toUpperCase()} · INSPECTION`}
    >
      <div style={{ marginBottom: 24 }}>
        <Link to="/links" className="ds-btn ds-btn-quiet ds-btn-sm">← All links</Link>
      </div>

      {loading && <div className="ds-loading">Fetching link…</div>}
      {err && <div className="ds-notice ds-notice-warn">Could not load link: {err}</div>}

      {link && (
        <>
          <section className="ds-hero">
            <div className="ds-hero-l">
              <div className="ds-kicker">Last 24 hours · clicks</div>
              <div className="ds-hero-figure">
                <span className="ds-hero-num">0</span>
                <span className="ds-hero-unit">verdicts</span>
              </div>
              <p className="ds-hero-note">Once this link is shared, every redirect appears here in real time.</p>
            </div>
            <dl className="ds-hero-side">
              <div className="ds-side-row"><dt>Slug</dt><dd>/{link.slug}</dd></div>
              <div className="ds-side-row"><dt>Destination</dt><dd style={{ wordBreak: "break-all" }}>{link.destination_url}</dd></div>
              <div className="ds-side-row"><dt>Status</dt><dd>{link.status ?? "active"}</dd></div>
              <div className="ds-side-row"><dt>Created</dt><dd>{new Date(link.created_at).toLocaleString()}</dd></div>
            </dl>
          </section>

          <hr className="ds-rule" />

          <section className="ds-grid-2">
            <div>
              <div className="ds-kicker">Top referers</div>
              <h2 className="ds-section-title">Source attribution.</h2>
              <div className="ds-empty" style={{ marginTop: 16 }}>
                <div className="ds-empty-title">No referers yet.</div>
                <div className="ds-empty-note">As clicks arrive, top sources roll up here automatically.</div>
              </div>
            </div>
            <div>
              <div className="ds-kicker">Recent verdicts</div>
              <h2 className="ds-section-title">Decision log.</h2>
              <table className="ds-table" style={{ marginTop: 16 }}>
                <thead><tr><th>Time</th><th>Verdict</th><th>Reason</th></tr></thead>
                <tbody><tr><td colSpan={3} className="muted" style={{ padding: 32, textAlign: "center" }}>— no verdicts yet —</td></tr></tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

/**
 * @file src/routes/_authenticated/docs.tsx
 * @description Embedded documentation index. Editorial article layout.
 */

import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/docs")({
  head: () => ({ meta: [{ title: "Docs — AegisRoute" }] }),
  component: DocsPage,
});

const SECTIONS = [
  { k: "Quickstart",          v: "Issue your first short link and route in under 3 minutes." },
  { k: "Routing rules",       v: "Compose decision trees from IP, geo, device, and ML signals." },
  { k: "Threat intelligence", v: "How AegisRoute scores each request before redirecting." },
  { k: "Webhooks",            v: "Stream verdicts and audit events to your own stack." },
  { k: "API reference",       v: "REST endpoints, authentication, rate limits, error codes." },
  { k: "SDKs",                v: "Officially maintained clients for Node, Python, and Go." },
];

function DocsPage() {
  return (
    <AppShell title="Docs." kicker="REFERENCE · GUIDES · API">
      <p style={{
        fontFamily: "var(--font-display)", fontWeight: 300, fontStyle: "italic",
        fontSize: 28, lineHeight: 1.35, maxWidth: 720, color: "var(--ink-soft)", margin: "8px 0 32px"
      }}>
        Every endpoint, every signal, every decision — documented as carefully
        as the product itself.
      </p>

      <div className="ds-grid-2">
        {SECTIONS.map((s) => (
          <article key={s.k} className="ds-panel">
            <div className="ds-kicker">Guide</div>
            <h2 className="ds-panel-title" style={{ marginTop: 8 }}>{s.k}</h2>
            <p style={{ color: "var(--muted)", margin: "12px 0 20px", fontSize: 13 }}>{s.v}</p>
            <button className="ds-btn ds-btn-ghost ds-btn-sm">Read →</button>
          </article>
        ))}
      </div>

      <hr className="ds-rule" />

      <section>
        <div className="ds-kicker">Example · Issue a link</div>
        <h2 className="ds-section-title">Three lines, one verdict-aware short URL.</h2>
        <pre className="ds-code" style={{ marginTop: 24 }}>{`curl https://api.aegisroute.com/v1/links \\
  -H "Authorization: Bearer sk_live_•••" \\
  -d '{"url":"https://your-destination.com/launch"}'`}</pre>
      </section>
    </AppShell>
  );
}

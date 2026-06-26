/**
 * @file src/routes/_authenticated/audit-logs.tsx
 * @description Append-only audit log viewer. Editorial table built from
 * shared ds-* primitives.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — AegisRoute" }] }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [query, setQuery] = useState("");

  return (
    <AppShell title="Audit." kicker="APPEND-ONLY · IMMUTABLE · SIGNED">
      <section className="ds-toolbar">
        <div className="ds-toolbar-l" style={{ flex: 1, maxWidth: 480 }}>
          <input
            className="ds-input"
            placeholder="Search by actor, action, or resource…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="ds-toolbar-r">
          <span className="ds-badge ds-badge-ok">Stream · live</span>
          <button className="ds-btn ds-btn-quiet ds-btn-sm">Export</button>
        </div>
      </section>

      <div className="ds-table-wrap">
        <table className="ds-table ds-table-cards">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5}>
                <div className="ds-empty">
                  <div className="ds-empty-title">No events yet.</div>
                  <div className="ds-empty-note">
                    Every create, update, delete, sign-in, key rotation, and
                    policy change is appended here with a cryptographic hash
                    chain. Your first action will appear in real time.
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

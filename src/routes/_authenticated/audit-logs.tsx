/**
 * @file src/routes/_authenticated/audit-logs.tsx
 * @description Append-only audit log viewer. Editorial table built from
 * shared ds-* primitives.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — AegisRoute" }] }),
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const [query, setQuery] = useState("");
  const session = useAuthStore((s) => s.session);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", query],
    queryFn: async () => {
      const res = await fetch(`/api/v1/audit-logs?limit=50${query ? `&event_type=${query}` : ''}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load audit logs");
      return res.json();
    },
    enabled: !!session?.access_token,
  });

  const logs = data?.data?.logs ?? [];

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
              <th>IP Address</th>
              <th>Action</th>
              <th>Bot Score</th>
              <th>Path</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
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
            ) : (
              logs.map((log: any) => (
                <tr key={log.id}>
                  <td>
                    {new Date(log.created_at).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
                    })}
                  </td>
                  <td className="font-mono text-sm">{log.ip_address || "—"}</td>
                  <td>
                    <span className={`ds-badge ${log.action === "BLOCKED" ? "ds-badge-warn" : "ds-badge-ok"}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.bot_probability_score !== null ? `${Math.round(log.bot_probability_score * 100)}%` : "—"}</td>
                  <td className="font-mono text-xs">{log.path || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

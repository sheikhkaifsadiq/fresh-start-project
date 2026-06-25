/**
 * @file src/components/links/LinksTable.tsx
 * @description Editorial table view for routed links.
 *
 * BUSINESS LOGIC PRESERVED from legacy LinksDataTable:
 *   - Identical Supabase query (`links` table, user-scoped, search via
 *     ilike on slug/destination_url, server-side pagination)
 *   - Toggle status via PUT /api/v1/links/:id
 *   - Delete via DELETE /api/v1/links/:id
 *
 * Presentation, motion, typography, and density were rebuilt to match
 * the AegisRoute landing page system. No Tailwind class soup.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LinkRecord, SortField, SortOrder } from "./types";

interface Props {
  refreshKey: number;
  onCreate: () => void;
}

export function LinksTable({ refreshKey, onCreate }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [rows, setRows] = useState<LinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userData.user) throw new Error("Not authenticated.");

      let q = (supabase as any)
        .from("links")
        .select("*", { count: "exact" })
        .eq("user_id", userData.user.id);

      if (query) {
        q = q.or(`slug.ilike.%${query}%,destination_url.ilike.%${query}%`);
      }
      q = q.order(sortField, { ascending: sortOrder === "asc" });
      const from = (page - 1) * pageSize;
      q = q.range(from, from + pageSize - 1);

      const { data, count, error: fetchErr } = await q;
      if (fetchErr) throw fetchErr;
      setRows((data ?? []) as LinkRecord[]);
      setTotal(count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load links.");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [supabase, query, sortField, sortOrder, page]);

  useEffect(() => {
    void fetchLinks();
  }, [fetchLinks, refreshKey]);

  const toggleActive = async (row: LinkRecord) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: !r.active } : r)));
    await fetch(`/api/v1/links/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
  };

  const removeRow = async (row: LinkRecord) => {
    if (!confirm(`Delete /${row.slug}? This cannot be undone.`)) return;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    await fetch(`/api/v1/links/${row.id}`, { method: "DELETE" });
    void fetchLinks();
  };

  const setSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="lk-table-card">
      <div className="lk-table-head">
        <div className="lk-search">
          <input
            type="search"
            placeholder="Search slug or destination"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button className="btn" onClick={onCreate}>
          New link <span className="arrow" style={{ marginLeft: 8 }}>→</span>
        </button>
      </div>

      <div className="lk-table-scroll">
        <table className="lk-table">
          <thead>
            <tr>
              <th onClick={() => setSort("slug")}>Slug</th>
              <th onClick={() => setSort("destination_url")}>Destination</th>
              <th onClick={() => setSort("click_count")} style={{ textAlign: "right" }}>Clicks</th>
              <th onClick={() => setSort("created_at")}>Created</th>
              <th>Status</th>
              <th aria-label="actions" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="lk-empty">loading routed links…</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="lk-empty lk-error">{error}</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="lk-empty">No links yet. Compose the first pathway →</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="mono">/{r.slug}</td>
                  <td className="lk-dest" title={r.destination_url}>{r.destination_url}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{r.click_count ?? 0}</td>
                  <td className="mono">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={`lk-status ${r.active ? "is-on" : "is-off"}`}
                      onClick={() => toggleActive(r)}
                      title={r.active ? "Pause routing" : "Resume routing"}
                    >
                      {r.active ? "live" : "paused"}
                    </button>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="lk-mini-btn"
                      onClick={() => navigator.clipboard?.writeText(`${location.origin}/${r.slug}`)}
                    >
                      copy
                    </button>
                    <button className="lk-mini-btn danger" onClick={() => removeRow(r)}>
                      delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="lk-table-foot">
        <span className="mono">{total} total · page {page}/{totalPages}</span>
        <div>
          <button
            className="lk-mini-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← prev
          </button>
          <button
            className="lk-mini-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            next →
          </button>
        </div>
      </div>
    </div>
  );
}

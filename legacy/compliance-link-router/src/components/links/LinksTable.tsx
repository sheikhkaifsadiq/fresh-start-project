// @ts-nocheck
'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Copy,
  Edit2,
  Trash2,
  QrCode,
  ExternalLink,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Link2,
  Plus,
  Shield,
  Bot,
  Activity,
  Pause,
  Play,
  AlertTriangle,
  Check,
  X,
  MoreHorizontal,
  Download,
  Eye,
} from 'lucide-react';
import type { LinkRow } from '@/app/(dashboard)/links/page';
import LinkDetailSlideout from './LinkDetailSlideout';
import QRCodeGenerator from './QRCodeGenerator';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SortField = 'slug' | 'destination_url' | 'click_count' | 'bot_rate' | 'ml_avg_score' | 'active' | 'created_at';
type SortDir = 'asc' | 'desc';

interface BulkAction {
  label: string;
  icon: React.ElementType;
  action: 'activate' | 'pause' | 'delete';
  variant: 'default' | 'danger';
}

const BULK_ACTIONS: BulkAction[] = [
  { label: 'Activate', icon: Play, action: 'activate', variant: 'default' },
  { label: 'Pause', icon: Pause, action: 'pause', variant: 'default' },
  { label: 'Delete', icon: Trash2, action: 'delete', variant: 'danger' },
];

const PAGE_SIZES = [10, 20, 50, 100];

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

function Sparkline({ data, color = '#8b5cf6' }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return <div className="h-8 w-20 rounded bg-white/5" />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const path = `M ${pts.join(' L ')}`;
  const fillPts = [`0,${h}`, ...pts, `${w},${h}`].join(' ');

  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#sg)" />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - ((data[data.length - 1] - min) / range) * h}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sort indicator
// ---------------------------------------------------------------------------

function SortIndicator({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ChevronsUpDown className="h-3 w-3 text-white/20" />;
  return dir === 'asc'
    ? <ChevronUp className="h-3 w-3 text-violet-400" />
    : <ChevronDown className="h-3 w-3 text-violet-400" />;
}

// ---------------------------------------------------------------------------
// Bot rate pill
// ---------------------------------------------------------------------------

function BotRatePill({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(1);
  const color =
    rate > 0.6 ? 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400' :
    rate > 0.35 ? 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400' :
    'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border bg-gradient-to-r px-2 py-0.5 text-xs font-semibold ${color}`}>
      <Bot className="h-3 w-3" />
      {pct}%
    </span>
  );
}

// ---------------------------------------------------------------------------
// ML Score badge
// ---------------------------------------------------------------------------

function MLScoreBadge({ score }: { score: number }) {
  const pct = (score * 100).toFixed(0);
  const color =
    score > 0.7 ? 'text-red-400' :
    score > 0.4 ? 'text-amber-400' :
    'text-emerald-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            score > 0.7 ? 'bg-red-500' : score > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${color}`}>{pct}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
      active
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
        : 'border-slate-500/30 bg-slate-500/10 text-slate-400'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
      {active ? 'Active' : 'Paused'}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Row action buttons
// ---------------------------------------------------------------------------

function RowActions({
  link,
  onEdit,
  onDelete,
  onCopy,
  onQR,
  onView,
}: {
  link: LinkRow;
  onEdit: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onQR: () => void;
  onView: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={onView}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-400"
        title="View details"
      >
        <Eye className="h-3.5 w-3.5" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleCopy}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-400"
        title="Copy short URL"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={onQR}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
        title="QR Code"
      >
        <QrCode className="h-3.5 w-3.5" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={onEdit}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/50 transition-colors hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-blue-400"
        title="Edit"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        onClick={onDelete}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/5 text-red-500/50 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
        title="Delete"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </motion.button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
        <Link2 className="h-9 w-9 text-white/20" />
      </div>
      <h3 className="text-lg font-bold text-white/60">
        {hasSearch ? 'No links match your search' : 'No links yet'}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-white/30">
        {hasSearch
          ? 'Try a different slug or destination URL'
          : 'Create your first compliance-shielded link to get started'}
      </p>
      {!hasSearch && (
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20"
        >
          <Plus className="h-4 w-4" />
          Create First Link
        </motion.button>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Confirm delete modal
// ---------------------------------------------------------------------------

function ConfirmDeleteModal({
  count,
  onConfirm,
  onCancel,
  loading,
}: {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0f0f2e] p-6 shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Delete {count} link{count !== 1 ? 's' : ''}?</h3>
            <p className="text-xs text-white/40">This action is irreversible</p>
          </div>
        </div>
        <p className="text-sm text-white/60 mb-6">
          All click analytics and audit logs associated with these links will remain in the system, but the links will no longer redirect traffic.
        </p>
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
          >
            {loading ? <Activity className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main LinksTable component
// ---------------------------------------------------------------------------

interface LinksTableProps {
  initialLinks: LinkRow[];
}

export default function LinksTable({ initialLinks }: LinksTableProps) {
  const [links, setLinks] = useState<LinkRow[]>(initialLinks);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ ids: string[] } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeQR, setActiveQR] = useState<LinkRow | null>(null);
  const [activeDetail, setActiveDetail] = useState<LinkRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  const showNotification = useCallback((type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // Filtering + sorting
  const filtered = useMemo(() => {
    let result = [...links];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.slug.toLowerCase().includes(q) || l.destination_url.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((l) => (statusFilter === 'active' ? l.active : !l.active));
    }

    result.sort((a, b) => {
      let av: string | number | boolean = a[sortField] as string | number | boolean;
      let bv: string | number | boolean = b[sortField] as string | number | boolean;
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [links, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allOnPageSelected = paginated.length > 0 && paginated.every((l) => selectedIds.has(l.id));
  const someSelected = selectedIds.size > 0;

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        paginated.forEach((l) => next.delete(l.id));
      } else {
        paginated.forEach((l) => next.add(l.id));
      }
      return next;
    });
  }

  async function executeBulkAction(action: 'activate' | 'pause' | 'delete') {
    const ids = Array.from(selectedIds);
    if (action === 'delete') {
      setConfirmDelete({ ids });
      return;
    }
    setBulkLoading(true);
    try {
      const token = document.cookie.match(/sb-[^=]+-auth-token=([^;]+)/)?.[1] ?? '';
      const res = await fetch('/api/v1/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids, action }),
      });
      const json = await res.json();
      if (json.success) {
        setLinks((prev) =>
          prev.map((l) =>
            ids.includes(l.id) ? { ...l, active: action === 'activate' } : l
          )
        );
        setSelectedIds(new Set());
        showNotification('success', `${ids.length} links ${action}d`);
      } else {
        showNotification('error', json.error ?? 'Action failed');
      }
    } catch {
      showNotification('error', 'Network error');
    } finally {
      setBulkLoading(false);
    }
  }

  async function executeDelete(ids: string[]) {
    setDeleteLoading(true);
    try {
      const token = document.cookie.match(/sb-[^=]+-auth-token=([^;]+)/)?.[1] ?? '';
      const res = await fetch('/api/v1/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids, action: 'delete' }),
      });
      const json = await res.json();
      if (json.success) {
        setLinks((prev) => prev.filter((l) => !ids.includes(l.id)));
        setSelectedIds(new Set());
        setConfirmDelete(null);
        showNotification('success', `${ids.length} link${ids.length !== 1 ? 's' : ''} deleted`);
      } else {
        showNotification('error', json.error ?? 'Delete failed');
      }
    } catch {
      showNotification('error', 'Network error');
    } finally {
      setDeleteLoading(false);
    }
  }

  async function deleteSingleLink(id: string) {
    setConfirmDelete({ ids: [id] });
  }

  function copyShortUrl(link: LinkRow) {
    navigator.clipboard.writeText(link.short_url).catch(() => {});
  }

  const ColHeader = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <th
      className={`cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1.5">
        {label}
        <SortIndicator field={field} current={sortField} dir={sortDir} />
      </div>
    </th>
  );

  return (
    <>
      {/* Notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed left-1/2 top-6 z-[200] flex items-center gap-3 rounded-2xl border px-5 py-3 shadow-2xl ${
              notification.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            } backdrop-blur-xl`}
          >
            {notification.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            <span className="text-sm font-semibold">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm delete */}
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDeleteModal
            count={confirmDelete.ids.length}
            onConfirm={() => executeDelete(confirmDelete.ids)}
            onCancel={() => setConfirmDelete(null)}
            loading={deleteLoading}
          />
        )}
      </AnimatePresence>

      {/* QR modal */}
      <AnimatePresence>
        {activeQR && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveQR(null)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f2e] p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">QR Code</h3>
                <button onClick={() => setActiveQR(null)} className="text-white/40 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <QRCodeGenerator url={activeQR.short_url} slug={activeQR.slug} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail slideout */}
      <AnimatePresence>
        {activeDetail && (
          <LinkDetailSlideout
            link={activeDetail}
            onClose={() => setActiveDetail(null)}
            onLinkUpdated={(updated) =>
              setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
            }
          />
        )}
      </AnimatePresence>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search slug or destination…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
            {(['all', 'active', 'paused'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-violet-600 text-white'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          <AnimatePresence>
            {someSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs font-semibold text-violet-400">
                  {selectedIds.size} selected
                </span>
                {BULK_ACTIONS.map((ba) => (
                  <motion.button
                    key={ba.action}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    disabled={bulkLoading}
                    onClick={() => executeBulkAction(ba.action)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 transition-colors ${
                      ba.variant === 'danger'
                        ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {bulkLoading ? <Activity className="h-3 w-3 animate-spin" /> : <ba.icon className="h-3 w-3" />}
                    {ba.label}
                  </motion.button>
                ))}
                <button onClick={() => setSelectedIds(new Set())} className="text-white/30 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="ml-auto text-xs text-white/30">
            {filtered.length} link{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/5">
                <th className="w-10 px-4 py-3">
                  <button onClick={togglePageAll} className="text-white/40 hover:text-white">
                    {allOnPageSelected
                      ? <CheckSquare className="h-4 w-4 text-violet-400" />
                      : <Square className="h-4 w-4" />}
                  </button>
                </th>
                <ColHeader field="slug" label="Slug" />
                <ColHeader field="destination_url" label="Destination" className="hidden lg:table-cell" />
                <ColHeader field="click_count" label="Clicks" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">7d Trend</th>
                <ColHeader field="bot_rate" label="Bot Rate" />
                <ColHeader field="ml_avg_score" label="ML Score" className="hidden xl:table-cell" />
                <ColHeader field="active" label="Status" />
                <ColHeader field="created_at" label="Created" className="hidden lg:table-cell" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <EmptyState hasSearch={search.trim().length > 0 || statusFilter !== 'all'} />
                    </td>
                  </tr>
                ) : (
                  paginated.map((link, idx) => (
                    <motion.tr
                      key={link.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18, delay: idx * 0.025 }}
                      className={`group border-b border-white/5 transition-colors hover:bg-white/[0.04] ${
                        selectedIds.has(link.id) ? 'bg-violet-500/5' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="w-10 px-4 py-3">
                        <button onClick={() => toggleRow(link.id)} className="text-white/40 hover:text-white">
                          {selectedIds.has(link.id)
                            ? <CheckSquare className="h-4 w-4 text-violet-400" />
                            : <Square className="h-4 w-4" />}
                        </button>
                      </td>

                      {/* Slug */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                            <Link2 className="h-3.5 w-3.5 text-violet-400" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white">/{link.slug}</div>
                            {link.password_hash && (
                              <div className="flex items-center gap-1 text-xs text-amber-400">
                                <Shield className="h-2.5 w-2.5" />
                                Protected
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <div className="flex items-center gap-1.5 max-w-[260px]">
                          <span className="truncate text-sm text-white/50" title={link.destination_url}>
                            {link.destination_url.replace(/^https?:\/\//, '')}
                          </span>
                          <a
                            href={link.destination_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 text-white/20 hover:text-white/60"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>

                      {/* Clicks */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold tabular-nums text-white">
                          {link.click_count.toLocaleString()}
                        </span>
                      </td>

                      {/* Sparkline */}
                      <td className="px-4 py-3">
                        <Sparkline
                          data={link.sparkline}
                          color={link.bot_rate > 0.5 ? '#f97316' : '#8b5cf6'}
                        />
                      </td>

                      {/* Bot rate */}
                      <td className="px-4 py-3">
                        <BotRatePill rate={link.bot_rate} />
                      </td>

                      {/* ML Score */}
                      <td className="hidden px-4 py-3 xl:table-cell">
                        <MLScoreBadge score={link.ml_avg_score} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge active={link.active} />
                      </td>

                      {/* Created */}
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="text-xs text-white/40">
                          {new Date(link.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <RowActions
                            link={link}
                            onView={() => setActiveDetail(link)}
                            onEdit={() => setActiveDetail(link)}
                            onDelete={() => deleteSingleLink(link.id)}
                            onCopy={() => copyShortUrl(link)}
                            onQR={() => setActiveQR(link)}
                          />
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-white outline-none focus:border-violet-500/50"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s} className="bg-[#0f0f2e]">{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                {[1, ...Array.from({ length: totalPages }, (_, i) => i + 1)].filter(
                  (p, _, arr) =>
                    arr.length <= 7 ||
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 2
                ).reduce<(number | 'ellipsis')[]>((acc, p, i, src) => {
                  if (i > 0 && (p as number) - (src[i - 1] as number) > 1) acc.push('ellipsis');
                  acc.push(p);
                  return acc;
                }, []).map((p, i) =>
                  p === 'ellipsis' ? (
                    <span key={`e-${i}`} className="px-1 text-white/20">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${
                        page === p
                          ? 'bg-violet-600 text-white'
                          : 'text-white/40 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


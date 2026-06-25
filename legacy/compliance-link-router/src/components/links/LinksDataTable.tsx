"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  ChevronDown, ChevronUp, MoreHorizontal, Copy, Trash, ExternalLink, 
  Edit3, BarChart2, ShieldAlert, CheckCircle2, XCircle, Search, 
  Filter, Download, Upload, RefreshCw, Zap, Shield
} from "lucide-react";
import QRCodeGenerator from "./QRCodeGenerator";
import CreateLinkModal from "./CreateLinkModal";

export type LinkRecord = {
  id: string;
  destination_url: string;
  slug: string;
  active: boolean;
  created_at: string;
  click_count: number;
  user_id: string;
  is_shielded?: boolean;
  tags?: string[];
  expiration_date?: string;
};

type SortField = "created_at" | "click_count" | "slug" | "destination_url";
type SortOrder = "asc" | "desc";

export default function LinksDataTable() {
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const supabase = createClient();
  const tableRef = useRef<HTMLDivElement>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      let query = supabase
        .from("links")
        .select("*", { count: "exact" })
        .eq("user_id", userData.user.id);
        
      if (searchQuery) {
        query = query.or(`slug.ilike.%${searchQuery}%,destination_url.ilike.%${searchQuery}%`);
      }
      
      query = query.order(sortField, { ascending: sortOrder === "asc" });
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
      
      const { data, count, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setLinks(data as LinkRecord[]);
      setTotalRecords(count || 0);
    } catch (err: any) {
      setError(err.message || "Failed to fetch links");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [supabase, searchQuery, sortField, sortOrder, page, pageSize]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedIds.size === links.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(links.map(l => l.id)));
    }
  };

  const handleCopy = async (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    await navigator.clipboard.writeText(url);
    // Show toast here in real app
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) throw error;
      setLinks(links.filter(l => l.id !== id));
      const newSelection = new Set(selectedIds);
      newSelection.delete(id);
      setSelectedIds(newSelection);
      setTotalRecords(prev => prev - 1);
    } catch (err: any) {
      console.error("Delete failed", err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      const idsToDelete = Array.from(selectedIds);
      const { error } = await supabase.from("links").delete().in("id", idsToDelete);
      if (error) throw error;
      setLinks(links.filter(l => !selectedIds.has(l.id)));
      setSelectedIds(new Set());
      fetchLinks(); // Refetch to correct pagination
    } catch (err: any) {
      console.error("Bulk delete failed", err);
    }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("links")
        .update({ active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      setLinks(links.map(l => l.id === id ? { ...l, active: !currentStatus } : l));
    } catch (err: any) {
      console.error("Status toggle failed", err);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchLinks();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-4 h-4 text-white/20 ml-1" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-400 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-400 ml-1" />
    );
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 text-white rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden" ref={tableRef}>
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
              Links Arsenal
            </h1>
            <p className="text-slate-400 mt-1 text-sm font-medium">
              Manage, monitor, and configure your highly compliant routing pathways.
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex items-center space-x-2 text-sm font-semibold text-slate-300"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center space-x-2 text-sm font-bold text-white border border-blue-400/30"
            >
              <Zap className="w-4 h-4" />
              <span>Create Link</span>
            </motion.button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 bg-white/5 p-4 rounded-xl border border-white/5 backdrop-blur-md">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search slugs, URLs, or tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700/50 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          
          <div className="flex items-center space-x-3 w-full md:w-auto">
            {selectedIds.size > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2"
              >
                <span className="text-sm font-medium text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-lg border border-blue-400/20">
                  {selectedIds.size} selected
                </span>
                <button 
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 text-sm font-medium text-red-400 bg-red-400/10 hover:bg-red-400/20 border border-red-400/20 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Trash className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </motion.div>
            )}
            <button className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-colors flex items-center space-x-2 text-sm font-medium text-slate-300">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl overflow-hidden backdrop-blur-sm shadow-inner relative min-h-[400px]">
          {loading && !isRefreshing && (
            <div className="absolute inset-0 z-20 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-sm font-medium text-blue-400 animate-pulse">Decrypting routing matrix...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-center space-x-3 max-w-lg text-center">
                <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === links.length && links.length > 0}
                      onChange={toggleAllSelection}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900 transition-all cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-200 transition-colors group" onClick={() => handleSort("slug")}>
                    <div className="flex items-center">
                      Short Link <SortIcon field="slug" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-200 transition-colors group" onClick={() => handleSort("destination_url")}>
                    <div className="flex items-center">
                      Destination <SortIcon field="destination_url" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-center cursor-pointer hover:text-slate-200 transition-colors group" onClick={() => handleSort("click_count")}>
                    <div className="flex items-center justify-center">
                      Engagements <SortIcon field="click_count" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-center">Status</th>
                  <th className="px-6 py-4 font-semibold cursor-pointer hover:text-slate-200 transition-colors group" onClick={() => handleSort("created_at")}>
                    <div className="flex items-center">
                      Created <SortIcon field="created_at" />
                    </div>
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <AnimatePresence>
                  {links.length === 0 && !loading && !error ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50">
                            <Zap className="w-8 h-8 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-slate-300 font-medium">No routing pathways found</p>
                            <p className="text-slate-500 text-sm mt-1">Create a new shielded link to begin tracking traffic.</p>
                          </div>
                          <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="mt-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                          >
                            Create First Link
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    links.map((link) => (
                      <motion.tr 
                        key={link.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`hover:bg-slate-800/30 transition-colors group ${selectedIds.has(link.id) ? 'bg-blue-900/10' : ''}`}
                      >
                        <td className="px-6 py-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.has(link.id)}
                            onChange={() => toggleSelection(link.id)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900 transition-all cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-200 flex items-center space-x-2">
                              <span>aegis.rt/{link.slug}</span>
                              {link.is_shielded && (
                                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                            </span>
                            <span className="text-xs text-slate-500 font-mono mt-0.5">{link.id.split('-')[0]}...</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2 max-w-[250px]">
                            <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                              <img src={`https://www.google.com/s2/favicons?domain=${link.destination_url}&sz=32`} className="w-4 h-4 rounded-sm" alt="" onError={(e) => { e.currentTarget.style.display='none' }} />
                            </div>
                            <span className="text-slate-300 truncate hover:text-blue-400 cursor-pointer transition-colors" title={link.destination_url}>
                              {link.destination_url}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 font-mono text-xs font-bold">
                            {link.click_count.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => toggleActiveStatus(link.id, link.active)}
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                              link.active 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${link.active ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            <span>{link.active ? 'Active' : 'Paused'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {new Date(link.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2 relative">
                            <button 
                              onClick={() => handleCopy(link.slug)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              title="Copy short link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              title="View analytics"
                            >
                              <BarChart2 className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdown(activeDropdown === link.id ? null : link.id);
                                }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              
                              <AnimatePresence>
                                {activeDropdown === link.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                                  >
                                    <div className="p-1">
                                      <button className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors flex items-center space-x-2">
                                        <Edit3 className="w-4 h-4" /> <span>Edit Details</span>
                                      </button>
                                      <a href={link.destination_url} target="_blank" rel="noopener noreferrer" className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-colors flex items-center space-x-2">
                                        <ExternalLink className="w-4 h-4" /> <span>Visit Destination</span>
                                      </a>
                                      <div className="h-px bg-slate-700/50 my-1 w-full" />
                                      <button 
                                        onClick={() => handleDelete(link.id)}
                                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors flex items-center space-x-2"
                                      >
                                        <Trash className="w-4 h-4" /> <span>Delete Link</span>
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="px-6 py-4 border-t border-slate-800/60 bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-sm text-slate-400">
              Showing <span className="font-semibold text-slate-200">{(page - 1) * pageSize + (links.length > 0 ? 1 : 0)}</span> to <span className="font-semibold text-slate-200">{Math.min(page * pageSize, totalRecords)}</span> of <span className="font-semibold text-slate-200">{totalRecords}</span> entries
            </div>
            <div className="flex items-center space-x-2">
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 mr-2"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Previous
              </button>
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalRecords / pageSize)) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button 
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition-all ${
                        page === p 
                          ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                          : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(Math.ceil(totalRecords / pageSize), p + 1))}
                disabled={page >= Math.ceil(totalRecords / pageSize)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateLinkModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
            onSuccess={() => {
              setIsCreateModalOpen(false);
              fetchLinks();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

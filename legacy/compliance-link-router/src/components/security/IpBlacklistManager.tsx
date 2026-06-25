"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ShieldAlert, Server, Activity, Database, CheckSquare, Plus, Trash2, Edit3, Search, Download, Upload } from "lucide-react";

interface BlacklistEntry {
  id: string;
  cidr: string;
  reason: string;
  source: string;
  addedAt: string;
  expiresAt: string | null;
  isActive: boolean;
}

const MOCK_ENTRIES: BlacklistEntry[] = [
  { id: "b1", cidr: "192.168.1.0/24", reason: "Known credential stuffing origin", source: "Manual", addedAt: "2023-10-01T12:00:00Z", expiresAt: null, isActive: true },
  { id: "b2", cidr: "10.0.0.5/32", reason: "Repeated API abuse", source: "Automated (ML)", addedAt: "2023-10-05T08:30:00Z", expiresAt: "2023-10-12T08:30:00Z", isActive: true },
  { id: "b3", cidr: "172.16.0.0/12", reason: "Compromised botnet infrastructure", source: "Threat Feed", addedAt: "2023-09-15T10:00:00Z", expiresAt: null, isActive: false },
];

export default function IpBlacklistManager() {
  const [entries, setEntries] = useState<BlacklistEntry[]>(MOCK_ENTRIES);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newCidr, setNewCidr] = useState("");
  const [newReason, setNewReason] = useState("");

  const handleAdd = () => {
    if (!newCidr) return;
    const entry: BlacklistEntry = {
      id: `b${Date.now()}`,
      cidr: newCidr,
      reason: newReason || "Manual addition",
      source: "Manual",
      addedAt: new Date().toISOString(),
      expiresAt: null,
      isActive: true
    };
    setEntries([entry, ...entries]);
    setIsAdding(false);
    setNewCidr("");
    setNewReason("");
  };

  const toggleActive = (id: string) => {
    setEntries(entries.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e));
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  const filtered = entries.filter(e => 
    e.cidr.includes(searchTerm) || e.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden font-sans">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-800/80 pb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-500" />
            IP & CIDR Reputations
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage static blocks overriding ML logic.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 shadow-md">
            <Upload className="w-4 h-4" />
          </button>
          <button className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 shadow-md">
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-rose-500/20"
          >
            {isAdding ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Cancel" : "Add Block"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="bg-slate-950/80 border border-rose-500/30 rounded-2xl p-5 overflow-hidden shadow-inner relative z-10"
          >
            <h3 className="text-sm font-bold text-rose-400 mb-4">Add New Block Record</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                placeholder="IP or CIDR (e.g. 192.168.1.0/24)"
                value={newCidr}
                onChange={(e) => setNewCidr(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-rose-500 font-mono"
              />
              <input 
                type="text" 
                placeholder="Reason (Optional)"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                className="flex-2 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-rose-500"
              />
              <button 
                onClick={handleAdd}
                className="bg-rose-500 hover:bg-rose-400 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-rose-500/20 whitespace-nowrap"
              >
                Confirm Block
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 space-y-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search blocks..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-indigo-500 text-slate-200"
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/30">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="p-4 pl-6">CIDR / IP</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="p-4 pl-6 font-mono text-sm text-slate-300">
                    {entry.cidr}
                  </td>
                  <td className="p-4 text-sm text-slate-400 max-w-xs truncate" title={entry.reason}>
                    {entry.reason}
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-slate-900 px-2 py-1 rounded border border-slate-700 text-slate-400">
                      {entry.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleActive(entry.id)}
                      className={`relative inline-flex items-center cursor-pointer`}
                    >
                      <div className={`w-11 h-6 rounded-full transition-colors ${entry.isActive ? 'bg-rose-500' : 'bg-slate-700'}`}>
                        <div className={`absolute top-[2px] left-[2px] bg-white border border-slate-300 rounded-full h-5 w-5 transition-transform ${entry.isActive ? 'translate-x-full border-white' : ''}`} />
                      </div>
                    </button>
                  </td>
                  <td className="p-4 pr-6 text-right space-x-2">
                    <button className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => removeEntry(entry.id)}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    No block entries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Ensure XCircle is available as we used it
function XCircle({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
  );
}

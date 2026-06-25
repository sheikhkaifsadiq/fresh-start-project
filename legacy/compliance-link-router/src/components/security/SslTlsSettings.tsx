"use client";

import React, { useState } from "react";
import { Lock, ShieldCheck, Key, Globe, FileKey, RefreshCw, CheckCircle2 } from "lucide-react";

export default function SslTlsSettings() {
  const [minVersion, setMinVersion] = useState("TLSv1.2");
  
  return (
    <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-6 shadow-2xl backdrop-blur-xl font-sans relative overflow-hidden">
      
      <div className="flex justify-between items-center mb-6 border-b border-slate-800/80 pb-4 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            SSL/TLS Encryption
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage Edge certificates and cryptographic policies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        
        {/* Managed Certs */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-400" /> Active Edge Certificates
          </h3>
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5">
            <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">aegis-route.com (Wildcard)</h4>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">Let's Encrypt / ECDSA</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-Renewing
              </span>
            </div>
            
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Valid From</span>
                <span className="text-slate-300">2023-09-01</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expires On</span>
                <span className="text-slate-300">2023-11-30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">SANs</span>
                <span className="text-slate-300">*.aegis-route.com, aegis-route.com</span>
              </div>
            </div>
            
            <button className="mt-5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-sm font-bold rounded-xl transition-colors border border-slate-700 flex justify-center items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Force Renewal
            </button>
          </div>
        </div>

        {/* TLS Policy */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-200 flex items-center gap-2">
            <Key className="w-4 h-4 text-slate-400" /> Cryptographic Policies
          </h3>
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-6">
            
            <div>
              <label className="text-sm font-bold text-slate-300 block mb-2">Minimum TLS Version</label>
              <select 
                value={minVersion}
                onChange={(e) => setMinVersion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
              >
                <option value="TLSv1.0">TLS 1.0 (Insecure, Legacy)</option>
                <option value="TLSv1.1">TLS 1.1 (Insecure)</option>
                <option value="TLSv1.2">TLS 1.2 (Recommended)</option>
                <option value="TLSv1.3">TLS 1.3 Only (Strict)</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Connections using older protocols will be dropped. TLS 1.2 is required for PCI compliance.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800">
               <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-300 text-sm">HSTS (Strict Transport Security)</h4>
                  <p className="text-xs text-slate-500">Force browsers to only use HTTPS.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

             <div className="pt-4 border-t border-slate-800">
               <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-300 text-sm">Always Use HTTPS</h4>
                  <p className="text-xs text-slate-500">Redirect all HTTP requests to HTTPS with 301.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Download, ExternalLink, Package, Zap, CheckCircle2, ChevronRight, TrendingUp, AlertTriangle, ShieldCheck, PieChart, Info, Building, Database, Shield, AlertCircle, Clock, Activity } from 'lucide-react';

export default function BillingSettings() {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "usage">("overview");
  
  const currentPlan = {
    name: "Enterprise Shield",
    price: 499,
    interval: "month",
    status: "active",
    renewalDate: new Date(Date.now() + 86400000 * 14).toLocaleDateString(),
    features: [
      "Advanced Bot Detection (ML Engine)",
      "Compliance Modes (GDPR, HIPAA)",
      "Unlimited Custom Domains",
      "99.99% Uptime SLA",
      "Dedicated Technical Account Manager"
    ]
  };

  const invoices = [
    { id: "inv_1A2B3C", date: "Jun 1, 2026", amount: 499.00, status: "paid", pdfUrl: "#" },
    { id: "inv_9X8Y7Z", date: "May 1, 2026", amount: 499.00, status: "paid", pdfUrl: "#" },
    { id: "inv_4M5N6P", date: "Apr 1, 2026", amount: 499.00, status: "paid", pdfUrl: "#" },
  ];

  const usageStats = {
    linksCreated: { current: 12450, limit: -1 }, // -1 means unlimited
    clicksProcessed: { current: 4820000, limit: 10000000 },
    apiRequests: { current: 8500000, limit: 20000000 },
    mlInferences: { current: 2100000, limit: 5000000 }
  };

  const getPercentage = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min(100, Math.round((current / limit) * 100));
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-emerald-500" />
          Billing & Usage
        </h2>
        <p className="text-zinc-400 mt-2 text-lg">
          Manage your subscription, view invoices, and monitor platform usage against your limits.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 backdrop-blur-xl flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "overview" ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
            >
              <Package className="w-5 h-5" />
              Plan Overview
            </button>
            <button
              onClick={() => setActiveTab("usage")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "usage" ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
            >
              <PieChart className="w-5 h-5" />
              Usage Statistics
            </button>
            <button
              onClick={() => setActiveTab("invoices")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "invoices" ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
            >
              <Download className="w-5 h-5" />
              Invoices
            </button>
          </div>

          <div className="mt-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-emerald-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
              <h4 className="font-semibold">Enterprise SLA</h4>
            </div>
            <p className="text-xs text-zinc-400 mb-4">
              Your account is covered by our 99.99% uptime guarantee and priority routing.
            </p>
            <a href="#" className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors">
              View SLA Details <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Building className="w-48 h-48" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                        {currentPlan.status}
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-1">{currentPlan.name}</h3>
                      <p className="text-zinc-400">Renews on {currentPlan.renewalDate}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">${currentPlan.price}</span>
                        <span className="text-zinc-500">/{currentPlan.interval}</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-800/50 pt-8">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Plan Features</h4>
                      <ul className="space-y-3">
                        {currentPlan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-zinc-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Payment Method</h4>
                        <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-8 bg-zinc-800 rounded flex items-center justify-center">
                              <span className="font-bold text-white text-xs italic">VISA</span>
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">•••• •••• •••• 4242</div>
                              <div className="text-zinc-500 text-xs">Expires 12/28</div>
                            </div>
                          </div>
                          <button className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                            Update
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/20">
                          Manage Subscription
                        </button>
                        <button className="px-4 py-2.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-medium rounded-xl transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "usage" && (
              <motion.div
                key="usage"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Clicks Usage */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-blue-400" /> Clicks Processed
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1">Global edge routing execution</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{formatNumber(usageStats.clicksProcessed.current)}</div>
                        <div className="text-xs text-zinc-500">/ {formatNumber(usageStats.clicksProcessed.limit)}</div>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-2">
                      <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${getPercentage(usageStats.clicksProcessed.current, usageStats.clicksProcessed.limit)}%` }}></div>
                    </div>
                    <div className="text-xs text-zinc-400 text-right">{getPercentage(usageStats.clicksProcessed.current, usageStats.clicksProcessed.limit)}% utilized</div>
                  </div>

                  {/* ML Inferences Usage */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          <Zap className="w-5 h-5 text-violet-400" /> ML Inferences
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1">Oracle ARM64 Engine evaluations</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{formatNumber(usageStats.mlInferences.current)}</div>
                        <div className="text-xs text-zinc-500">/ {formatNumber(usageStats.mlInferences.limit)}</div>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-2">
                      <div className="bg-violet-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${getPercentage(usageStats.mlInferences.current, usageStats.mlInferences.limit)}%` }}></div>
                    </div>
                    <div className="text-xs text-zinc-400 text-right">{getPercentage(usageStats.mlInferences.current, usageStats.mlInferences.limit)}% utilized</div>
                  </div>

                  {/* API Requests */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          <Activity className="w-5 h-5 text-fuchsia-400" /> API Requests
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1">Management & programmatic access</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{formatNumber(usageStats.apiRequests.current)}</div>
                        <div className="text-xs text-zinc-500">/ {formatNumber(usageStats.apiRequests.limit)}</div>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-2">
                      <div className="bg-fuchsia-500 h-2.5 rounded-full transition-all duration-1000" style={{ width: `${getPercentage(usageStats.apiRequests.current, usageStats.apiRequests.limit)}%` }}></div>
                    </div>
                    <div className="text-xs text-zinc-400 text-right">{getPercentage(usageStats.apiRequests.current, usageStats.apiRequests.limit)}% utilized</div>
                  </div>

                  {/* Links Created */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          <Package className="w-5 h-5 text-emerald-400" /> Active Links
                        </h4>
                        <p className="text-xs text-zinc-500 mt-1">Short URLs stored in database</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{formatNumber(usageStats.linksCreated.current)}</div>
                        <div className="text-xs text-emerald-500">Unlimited</div>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2.5 mb-2">
                      <div className="bg-emerald-500 h-2.5 rounded-full w-full opacity-50"></div>
                    </div>
                    <div className="text-xs text-zinc-400 text-right">No limits applied</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-200">
                    Usage statistics are delayed by approximately 15 minutes. If you exceed your limits, service will continue uninterrupted, but overage charges will be applied to your next invoice at a rate of $0.10 per 1,000 additional units.
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "invoices" && (
              <motion.div
                key="invoices"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800/50 bg-zinc-900/50">
                        <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Invoice ID</th>
                        <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date</th>
                        <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Amount</th>
                        <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="p-4 font-mono text-sm text-zinc-300">{invoice.id}</td>
                          <td className="p-4 text-sm text-zinc-400">{invoice.date}</td>
                          <td className="p-4 text-sm font-medium text-white">${invoice.amount.toFixed(2)}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                              {invoice.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <a href={invoice.pdfUrl} className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
                              <Download className="w-4 h-4" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center px-4 py-3 bg-zinc-900/30 border border-zinc-800 rounded-xl text-sm">
                  <span className="text-zinc-400">Need older invoices or custom billing details?</span>
                  <a href="#" className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors">
                    Contact Support <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

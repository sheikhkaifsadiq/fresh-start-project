"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link as LinkIcon, Network, Database, QrCode, ShieldCheck, 
  BarChart3, Activity, Zap, Layers
} from 'lucide-react';

import LinksDataTable from '@/components/links/LinksDataTable';
import RuleBuilder from '@/components/links/RuleBuilder';
import BulkOperations from '@/components/links/BulkOperations';
import LinkFilters from '@/components/links/LinkFilters';
import QRCodeGenerator from '@/components/links/QRCodeGenerator';

type Tab = 'inventory' | 'routing' | 'bulk' | 'qr';

export default function LinksManagerClient() {
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; description: string }[] = [
    { 
      id: 'inventory', 
      label: 'Link Arsenal', 
      icon: <Layers className="w-5 h-5" />,
      description: 'Manage all your generated URLs'
    },
    { 
      id: 'routing', 
      label: 'Routing Engine', 
      icon: <Network className="w-5 h-5" />,
      description: 'Build complex traffic rules'
    },
    { 
      id: 'bulk', 
      label: 'Bulk Ingestion', 
      icon: <Database className="w-5 h-5" />,
      description: 'Mass import via CSV'
    },
    { 
      id: 'qr', 
      label: 'Smart QR Labs', 
      icon: <QrCode className="w-5 h-5" />,
      description: 'Generate dynamic QR codes'
    }
  ];

  return (
    <div className="flex flex-col space-y-8 pb-20">
      
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between space-y-6 md:space-y-0">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.15)]">
              <LinkIcon className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white">Pathway Command</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Aegis Shield Active</span>
                </span>
                <span className="flex items-center space-x-1.5 text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                  <Activity className="w-3.5 h-3.5" />
                  <span>ML Engine Connected</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 backdrop-blur-md overflow-x-auto custom-scrollbar hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'text-white' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl -z-10 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className={`relative z-10 ${activeTab === tab.id ? 'text-white' : ''}`}>
                {tab.icon}
              </span>
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="relative min-h-[700px]">
        <AnimatePresence mode="wait">
          
          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-slate-400 text-sm">Overview of all active and inactive routing pathways.</p>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-2 transition-all ${
                    isFilterOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Advanced Query Builder</span>
                </button>
              </div>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <LinkFilters onApply={(q) => console.log('Query Applied:', q)} />
                  </motion.div>
                )}
              </AnimatePresence>

              <LinksDataTable />
            </motion.div>
          )}

          {activeTab === 'routing' && (
            <motion.div
              key="routing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <Network className="w-6 h-6 text-indigo-400" />
                  <span>Visual Routing Matrix</span>
                </h2>
                <p className="text-slate-400 mt-1">Design complex conditional routing logic using the node graph. This connects directly to our Oracle ARM64 ML processing engine via secure tunnel.</p>
              </div>
              <RuleBuilder />
            </motion.div>
          )}

          {activeTab === 'bulk' && (
            <motion.div
              key="bulk"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
               <div className="mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <Database className="w-6 h-6 text-emerald-400" />
                  <span>Mass Data Ingestion</span>
                </h2>
                <p className="text-slate-400 mt-1">Import up to 100,000 links simultaneously via CSV. The engine will automatically validate and protect them.</p>
              </div>
              <BulkOperations />
            </motion.div>
          )}

          {activeTab === 'qr' && (
            <motion.div
              key="qr"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                  <QrCode className="w-6 h-6 text-purple-400" />
                  <span>Smart QR Labs</span>
                </h2>
                <p className="text-slate-400 mt-1">Design and export high-fidelity dynamic QR codes that integrate deeply with Aegis Shield.</p>
              </div>
              <QRCodeGenerator url="https://example.com" slug="demo-qr-slug" />
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

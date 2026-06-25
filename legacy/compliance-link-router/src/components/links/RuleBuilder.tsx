"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitMerge, Plus, Trash2, ArrowRight, Save, Play, Clock, 
  Globe, Smartphone, Target, Fingerprint, ShieldAlert,
  Settings2, Activity
} from 'lucide-react';

export type ConditionType = 'geo' | 'device' | 'time' | 'utm' | 'ip_risk' | 'referral';
export type ActionType = 'route' | 'block' | 'delay' | 'webhook';

export interface RuleNode {
  id: string;
  type: 'condition' | 'action';
  subType: ConditionType | ActionType;
  params: Record<string, any>;
  nextNodes: string[];
}

// Initial mock state for a massive rule set
const initialNodes: Record<string, RuleNode> = {
  'root': {
    id: 'root',
    type: 'condition',
    subType: 'ip_risk',
    params: { threshold: 80 },
    nextNodes: ['node_block_high_risk', 'node_geo_check']
  },
  'node_block_high_risk': {
    id: 'node_block_high_risk',
    type: 'action',
    subType: 'block',
    params: { message: 'Access denied due to high risk IP' },
    nextNodes: []
  },
  'node_geo_check': {
    id: 'node_geo_check',
    type: 'condition',
    subType: 'geo',
    params: { country: 'US,CA' },
    nextNodes: ['node_route_na', 'node_device_check']
  },
  'node_route_na': {
    id: 'node_route_na',
    type: 'action',
    subType: 'route',
    params: { url: 'https://na.example.com' },
    nextNodes: []
  },
  'node_device_check': {
    id: 'node_device_check',
    type: 'condition',
    subType: 'device',
    params: { device: 'mobile' },
    nextNodes: ['node_route_mobile', 'node_route_default']
  },
  'node_route_mobile': {
    id: 'node_route_mobile',
    type: 'action',
    subType: 'route',
    params: { url: 'app://example' },
    nextNodes: []
  },
  'node_route_default': {
    id: 'node_route_default',
    type: 'action',
    subType: 'route',
    params: { url: 'https://example.com' },
    nextNodes: []
  }
};

export default function RuleBuilder() {
  const [nodes, setNodes] = useState<Record<string, RuleNode>>(initialNodes);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const getTypeIcon = (subType: ConditionType | ActionType) => {
    switch (subType) {
      case 'geo': return <Globe className="w-5 h-5 text-blue-400" />;
      case 'device': return <Smartphone className="w-5 h-5 text-indigo-400" />;
      case 'time': return <Clock className="w-5 h-5 text-purple-400" />;
      case 'utm': return <Target className="w-5 h-5 text-pink-400" />;
      case 'ip_risk': return <Fingerprint className="w-5 h-5 text-orange-400" />;
      case 'route': return <ArrowRight className="w-5 h-5 text-emerald-400" />;
      case 'block': return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'webhook': return <Activity className="w-5 h-5 text-cyan-400" />;
      default: return <Settings2 className="w-5 h-5 text-slate-400" />;
    }
  };

  const getLabel = (subType: ConditionType | ActionType) => {
    switch (subType) {
      case 'ip_risk': return 'If IP Risk Score >';
      case 'geo': return 'If Country in';
      case 'device': return 'If Device is';
      case 'route': return 'Route to';
      case 'block': return 'Block Traffic';
      default: return subType;
    }
  };

  const generateId = () => `node_${Math.random().toString(36).substr(2, 9)}`;

  const addBranch = (parentId: string, type: 'condition' | 'action', subType: ConditionType | ActionType) => {
    const newId = generateId();
    const newNode: RuleNode = {
      id: newId,
      type,
      subType,
      params: {},
      nextNodes: []
    };

    setNodes(prev => {
      const next = { ...prev, [newId]: newNode };
      if (prev[parentId]) {
        next[parentId] = {
          ...prev[parentId],
          nextNodes: [...prev[parentId].nextNodes, newId]
        };
      }
      return next;
    });
    setSelectedNodeId(newId);
  };

  const deleteNode = (id: string) => {
    if (id === 'root') return; // Cannot delete root
    setNodes(prev => {
      const next = { ...prev };
      // Remove references
      Object.keys(next).forEach(key => {
        if (next[key].nextNodes.includes(id)) {
          next[key].nextNodes = next[key].nextNodes.filter(n => n !== id);
        }
      });
      // Recursive delete children (simplified for this example, real app would be deep)
      delete next[id];
      return next;
    });
    setSelectedNodeId(null);
  };

  const updateNodeParams = (id: string, key: string, value: any) => {
    setNodes(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        params: { ...prev[id].params, [key]: value }
      }
    }));
  };

  // Recursive render
  const renderNode = (nodeId: string, depth = 0) => {
    const node = nodes[nodeId];
    if (!node) return null;

    const isSelected = selectedNodeId === nodeId;

    return (
      <div key={nodeId} className="flex flex-col items-center relative">
        {/* Node itself */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setSelectedNodeId(nodeId)}
          className={`
            w-64 p-4 rounded-xl border-2 cursor-pointer transition-all bg-slate-900/80 backdrop-blur-md shadow-xl z-10
            ${isSelected ? 'border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-105' : 'border-slate-700 hover:border-slate-500'}
            ${node.type === 'action' ? (node.subType === 'block' ? 'border-red-500/50' : 'border-emerald-500/50') : ''}
          `}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-slate-800">
                {getTypeIcon(node.subType)}
              </div>
              <span className="text-sm font-bold text-slate-200 capitalize tracking-wide">
                {node.type}
              </span>
            </div>
            {nodeId !== 'root' && (
              <button 
                onClick={(e) => { e.stopPropagation(); deleteNode(nodeId); }}
                className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block mb-1">
              {getLabel(node.subType)}
            </span>
            <div className="text-sm text-white font-mono break-all truncate">
              {Object.values(node.params).join(', ') || 'Not configured'}
            </div>
          </div>
          
          {/* Quick Add Buttons under node if it's a condition */}
          {node.type === 'condition' && isSelected && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-20"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); addBranch(nodeId, 'condition', 'geo'); }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" /> <span>Condition</span>
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); addBranch(nodeId, 'action', 'route'); }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" /> <span>Action</span>
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Children Branches */}
        {node.nextNodes.length > 0 && (
          <div className="flex relative mt-16 pt-8">
            {/* Connecting Lines */}
            <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-slate-600 -translate-x-1/2" />
            
            {node.nextNodes.length > 1 && (
              <div 
                className="absolute top-8 h-0.5 bg-slate-600" 
                style={{
                  left: `${100 / (node.nextNodes.length * 2)}%`,
                  right: `${100 / (node.nextNodes.length * 2)}%`
                }}
              />
            )}

            {node.nextNodes.map((childId, index) => (
              <div key={childId} className="flex flex-col items-center flex-1 px-4 relative min-w-[300px]">
                {node.nextNodes.length > 1 && (
                  <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-slate-600 -translate-x-1/2" />
                )}
                
                {/* Branch Label */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 border border-slate-600 px-3 py-1 rounded-full text-xs font-bold text-slate-300 z-10 whitespace-nowrap">
                  {index === 0 ? 'Match (True)' : 'Fallback (False)'}
                </div>
                
                {renderNode(childId, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-[800px] w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      
      {/* Canvas Area */}
      <div className="flex-1 relative overflow-auto custom-scrollbar bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
        
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgTCA0MCAwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] pointer-events-none" />

        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-30 flex items-center space-x-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-2 shadow-lg">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg flex items-center space-x-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Save className="w-4 h-4" /> <span>Save Routing Tree</span>
          </button>
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-lg flex items-center space-x-2 transition-colors border border-slate-700">
            <Play className="w-4 h-4 text-emerald-400" /> <span>Simulate Request</span>
          </button>
        </div>

        {/* Rule Tree Container */}
        <div className="min-w-max p-20 pt-32 flex justify-center">
          {renderNode('root')}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {selectedNodeId && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-slate-800 bg-slate-900 flex flex-col z-20 flex-shrink-0"
          >
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Settings2 className="w-5 h-5 text-blue-400" />
                <span>Node Configuration</span>
              </h3>
              <button 
                onClick={() => setSelectedNodeId(null)}
                className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {nodes[selectedNodeId]?.type === 'condition' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Condition Type</label>
                    <select 
                      value={nodes[selectedNodeId].subType}
                      onChange={(e) => {
                        setNodes(prev => ({
                          ...prev,
                          [selectedNodeId]: { ...prev[selectedNodeId], subType: e.target.value as any, params: {} }
                        }));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/50 appearance-none"
                    >
                      <option value="ip_risk">Aegis IP Risk Score</option>
                      <option value="geo">Geographic Location (Country/City)</option>
                      <option value="device">Device & OS</option>
                      <option value="time">Time of Day / Day of Week</option>
                      <option value="utm">UTM Parameters</option>
                      <option value="referral">Referral Source</option>
                    </select>
                  </div>

                  {nodes[selectedNodeId].subType === 'ip_risk' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Risk Threshold (0-100)</label>
                      <input 
                        type="number" 
                        value={nodes[selectedNodeId].params.threshold || ''}
                        onChange={(e) => updateNodeParams(selectedNodeId, 'threshold', parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200"
                        placeholder="e.g. 80"
                      />
                      <p className="text-xs text-slate-500 mt-2">Scores above this threshold will follow the True branch.</p>
                    </div>
                  )}

                  {nodes[selectedNodeId].subType === 'geo' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Country Codes (Comma separated)</label>
                      <input 
                        type="text" 
                        value={nodes[selectedNodeId].params.country || ''}
                        onChange={(e) => updateNodeParams(selectedNodeId, 'country', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 uppercase"
                        placeholder="US, CA, GB"
                      />
                    </div>
                  )}

                  {nodes[selectedNodeId].subType === 'device' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Device Type</label>
                      <select 
                        value={nodes[selectedNodeId].params.device || ''}
                        onChange={(e) => updateNodeParams(selectedNodeId, 'device', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 appearance-none"
                      >
                        <option value="">Select...</option>
                        <option value="mobile">Mobile</option>
                        <option value="desktop">Desktop</option>
                        <option value="tablet">Tablet</option>
                        <option value="bot">Known Bot/Crawler</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {nodes[selectedNodeId]?.type === 'action' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Action Type</label>
                    <select 
                      value={nodes[selectedNodeId].subType}
                      onChange={(e) => {
                        setNodes(prev => ({
                          ...prev,
                          [selectedNodeId]: { ...prev[selectedNodeId], subType: e.target.value as any, params: {} }
                        }));
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500/50 appearance-none"
                    >
                      <option value="route">Route to Destination</option>
                      <option value="block">Block Traffic</option>
                      <option value="webhook">Fire Webhook</option>
                    </select>
                  </div>

                  {nodes[selectedNodeId].subType === 'route' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Destination URL</label>
                      <input 
                        type="url" 
                        value={nodes[selectedNodeId].params.url || ''}
                        onChange={(e) => updateNodeParams(selectedNodeId, 'url', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200"
                        placeholder="https://..."
                      />
                    </div>
                  )}

                  {nodes[selectedNodeId].subType === 'block' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Block Reason/Message</label>
                      <input 
                        type="text" 
                        value={nodes[selectedNodeId].params.message || ''}
                        onChange={(e) => updateNodeParams(selectedNodeId, 'message', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200"
                        placeholder="Access Denied"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 border-t border-slate-800 mt-auto">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-400 overflow-hidden break-all">
                  <div className="text-slate-500 mb-1 font-bold">Node JSON Payload:</div>
                  {JSON.stringify(nodes[selectedNodeId], null, 2)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Need local X component import for the close button above */}
    </div>
  );
}

// Inline missing import for X
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);

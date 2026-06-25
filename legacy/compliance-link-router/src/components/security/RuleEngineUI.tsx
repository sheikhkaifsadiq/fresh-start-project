"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GitMerge, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  Terminal, 
  Database,
  Globe,
  Clock,
  Settings,
  Plus,
  Save,
  Trash2,
  GripVertical
} from "lucide-react";

type ConditionType = "IP_MATCH" | "GEO_MATCH" | "BOT_SCORE" | "HEADER_REGEX" | "TIME_WINDOW" | "RATE_LIMIT";
type ActionType = "ALLOW" | "BLOCK" | "CHALLENGE" | "REDIRECT" | "LOG_ONLY" | "DELAY";

interface RuleCondition {
  id: string;
  type: ConditionType;
  operator: "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "IN" | "NOT_IN" | "MATCHES";
  value: string;
}

interface TrafficRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  action: ActionType;
  actionPayload?: string; // e.g. Redirect URL
}

const DEFAULT_RULES: TrafficRule[] = [
  {
    id: "r_1",
    name: "Block Tor Exit Nodes",
    description: "Deny access from known Tor exit nodes via threat intel feed.",
    enabled: true,
    priority: 1,
    conditions: [
      { id: "c_1", type: "IP_MATCH", operator: "IN", value: "$THREAT_INTEL_TOR" }
    ],
    action: "BLOCK"
  },
  {
    id: "r_2",
    name: "High Bot Score Challenge",
    description: "Issue JS challenge if bot probability > 85%",
    enabled: true,
    priority: 10,
    conditions: [
      { id: "c_2", type: "BOT_SCORE", operator: "GREATER_THAN", value: "0.85" }
    ],
    action: "CHALLENGE"
  },
  {
    id: "r_3",
    name: "Geoblock Restricted Regions",
    description: "Comply with export laws by blocking sanctioned regions.",
    enabled: true,
    priority: 5,
    conditions: [
      { id: "c_3", type: "GEO_MATCH", operator: "IN", value: "CU, IR, KP, SY" }
    ],
    action: "BLOCK"
  }
];

export default function RuleEngineUI() {
  const [rules, setRules] = useState<TrafficRule[]>(DEFAULT_RULES);
  const [activeRuleId, setActiveRuleId] = useState<string | null>(null);

  const activeRule = rules.find(r => r.id === activeRuleId);

  const addRule = () => {
    const newRule: TrafficRule = {
      id: `r_${Date.now()}`,
      name: "New Routing Rule",
      description: "Description of the rule behavior",
      enabled: false,
      priority: rules.length > 0 ? Math.max(...rules.map(r => r.priority)) + 10 : 10,
      conditions: [{ id: `c_${Date.now()}`, type: "IP_MATCH", operator: "EQUALS", value: "" }],
      action: "LOG_ONLY"
    };
    setRules([...rules, newRule]);
    setActiveRuleId(newRule.id);
  };

  const updateActiveRule = (updates: Partial<TrafficRule>) => {
    if (!activeRuleId) return;
    setRules(prev => prev.map(r => r.id === activeRuleId ? { ...r, ...updates } : r));
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    if (activeRuleId === id) setActiveRuleId(null);
  };

  const getActionColor = (action: ActionType) => {
    switch(action) {
      case "ALLOW": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "BLOCK": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "CHALLENGE": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "REDIRECT": return "text-blue-400 bg-blue-500/10 border-blue-500/20";
      case "DELAY": return "text-purple-400 bg-purple-500/10 border-purple-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="flex h-[800px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl font-sans">
      
      {/* Sidebar - Rule List */}
      <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-indigo-400" />
            Execution Chain
          </h2>
          <button 
            onClick={addRule}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <AnimatePresence>
            {rules.sort((a,b) => a.priority - b.priority).map((rule, idx) => (
              <motion.div
                key={rule.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setActiveRuleId(rule.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                  activeRuleId === rule.id 
                    ? "bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5" 
                    : "bg-slate-950/50 border-slate-800/50 hover:bg-slate-800/50 hover:border-slate-700"
                } ${!rule.enabled && "opacity-60 grayscale-[0.5]"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-slate-600 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      #{idx + 1}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold border ${getActionColor(rule.action)}`}>
                      {rule.action}
                    </span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${rule.enabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-600"}`} />
                </div>
                <h3 className={`font-semibold truncate ${activeRuleId === rule.id ? "text-indigo-100" : "text-slate-200"}`}>
                  {rule.name}
                </h3>
                <p className="text-xs text-slate-500 truncate mt-1">{rule.description}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Main Area - Rule Editor */}
      <div className="flex-1 flex flex-col bg-slate-950/50">
        {activeRule ? (
          <>
            <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex justify-between items-start">
              <div className="space-y-4 w-full max-w-2xl">
                <input 
                  value={activeRule.name}
                  onChange={(e) => updateActiveRule({ name: e.target.value })}
                  className="bg-transparent text-2xl font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-indigo-500 outline-none w-full transition-colors pb-1"
                />
                <input 
                  value={activeRule.description}
                  onChange={(e) => updateActiveRule({ description: e.target.value })}
                  className="bg-transparent text-sm text-slate-400 border-b border-transparent hover:border-slate-700 focus:border-indigo-500 outline-none w-full transition-colors pb-1"
                />
              </div>
              <div className="flex gap-3 ml-4">
                <button 
                  onClick={() => updateActiveRule({ enabled: !activeRule.enabled })}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                    activeRule.enabled 
                      ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30" 
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  }`}
                >
                  {activeRule.enabled ? "Disable Rule" : "Enable Rule"}
                </button>
                <button 
                  onClick={() => deleteRule(activeRule.id)}
                  className="p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-colors border border-transparent hover:border-rose-500/30"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              
              {/* Conditions Builder */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-4 h-4" /> When Request Matches
                </h3>
                
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-inner">
                  {activeRule.conditions.map((condition, index) => (
                    <div key={condition.id} className="flex flex-col gap-3">
                      {index > 0 && <div className="text-xs font-bold text-indigo-400 pl-4 py-2">AND</div>}
                      <div className="flex flex-wrap gap-3 items-center bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                        <select 
                          value={condition.type}
                          onChange={(e) => {
                            const newConds = [...activeRule.conditions];
                            newConds[index].type = e.target.value as ConditionType;
                            updateActiveRule({ conditions: newConds });
                          }}
                          className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                        >
                          <option value="IP_MATCH">Client IP Address</option>
                          <option value="GEO_MATCH">Geolocation (Country Code)</option>
                          <option value="BOT_SCORE">ML Bot Score</option>
                          <option value="HEADER_REGEX">HTTP Header (Regex)</option>
                          <option value="RATE_LIMIT">Rate Limit Exceeded</option>
                        </select>

                        <select 
                          value={condition.operator}
                          onChange={(e) => {
                            const newConds = [...activeRule.conditions];
                            newConds[index].operator = e.target.value as any;
                            updateActiveRule({ conditions: newConds });
                          }}
                          className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                        >
                          <option value="EQUALS">Equals</option>
                          <option value="NOT_EQUALS">Does Not Equal</option>
                          <option value="MATCHES">Matches Pattern</option>
                          <option value="IN">Is In List</option>
                          <option value="GREATER_THAN">Is Greater Than</option>
                          <option value="LESS_THAN">Is Less Than</option>
                        </select>

                        <input 
                          type="text" 
                          value={condition.value}
                          onChange={(e) => {
                            const newConds = [...activeRule.conditions];
                            newConds[index].value = e.target.value;
                            updateActiveRule({ conditions: newConds });
                          }}
                          placeholder="Value..."
                          className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono placeholder:text-slate-600 min-w-[200px]"
                        />
                        
                        <button 
                          onClick={() => {
                            if (activeRule.conditions.length <= 1) return;
                            const newConds = activeRule.conditions.filter((_, i) => i !== index);
                            updateActiveRule({ conditions: newConds });
                          }}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => {
                      updateActiveRule({ 
                        conditions: [...activeRule.conditions, { id: `c_${Date.now()}`, type: "IP_MATCH", operator: "EQUALS", value: "" }] 
                      });
                    }}
                    className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors px-2"
                  >
                    <Plus className="w-4 h-4" /> Add Condition
                  </button>
                </div>
              </section>

              {/* Action Builder */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Then Execute Action
                </h3>
                
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-inner flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className="relative">
                    <select 
                      value={activeRule.action}
                      onChange={(e) => updateActiveRule({ action: e.target.value as ActionType })}
                      className={`appearance-none bg-slate-950 border-2 font-bold text-sm rounded-xl pl-4 pr-10 py-3 outline-none transition-all cursor-pointer ${
                        activeRule.action === "BLOCK" ? "border-rose-500/50 text-rose-400 focus:border-rose-500" :
                        activeRule.action === "ALLOW" ? "border-emerald-500/50 text-emerald-400 focus:border-emerald-500" :
                        activeRule.action === "CHALLENGE" ? "border-amber-500/50 text-amber-400 focus:border-amber-500" :
                        "border-slate-700 text-slate-300 focus:border-indigo-500"
                      }`}
                    >
                      <option value="ALLOW">ALLOW REQUEST</option>
                      <option value="BLOCK">BLOCK REQUEST</option>
                      <option value="CHALLENGE">JS CHALLENGE</option>
                      <option value="REDIRECT">REDIRECT</option>
                      <option value="DELAY">TARPIT / DELAY</option>
                      <option value="LOG_ONLY">LOG ONLY</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ArrowRight className={`w-4 h-4 ${
                        activeRule.action === "BLOCK" ? "text-rose-400" :
                        activeRule.action === "ALLOW" ? "text-emerald-400" :
                        activeRule.action === "CHALLENGE" ? "text-amber-400" : "text-slate-400"
                      }`} />
                    </div>
                  </div>

                  {activeRule.action === "REDIRECT" && (
                    <input 
                      type="text" 
                      value={activeRule.actionPayload || ""}
                      onChange={(e) => updateActiveRule({ actionPayload: e.target.value })}
                      placeholder="https://example.com/blocked"
                      className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  )}
                  
                  {activeRule.action === "DELAY" && (
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        value={activeRule.actionPayload || "5000"}
                        onChange={(e) => updateActiveRule({ actionPayload: e.target.value })}
                        className="w-24 bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-mono text-center"
                      />
                      <span className="text-slate-500 text-sm font-medium">milliseconds</span>
                    </div>
                  )}

                  <div className="flex-1 text-sm text-slate-500">
                    {activeRule.action === "BLOCK" && "Immediately terminate the connection with 403 Forbidden."}
                    {activeRule.action === "ALLOW" && "Bypass remaining security rules and route traffic."}
                    {activeRule.action === "CHALLENGE" && "Serve a computationally expensive proof-of-work JS puzzle."}
                    {activeRule.action === "LOG_ONLY" && "Record the match in audit logs without altering the request."}
                  </div>
                </div>
              </section>

              {/* Advanced Settings */}
              <section className="space-y-4 pt-4 border-t border-slate-800/80">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Advanced
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-300">Priority Weight</p>
                      <p className="text-xs text-slate-500">Lower numbers execute first</p>
                    </div>
                    <input 
                      type="number" 
                      value={activeRule.priority}
                      onChange={(e) => updateActiveRule({ priority: parseInt(e.target.value) || 0 })}
                      className="w-20 bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500 text-center font-mono"
                    />
                  </div>
                </div>
              </section>

            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-4">
              <button className="px-5 py-2.5 text-slate-300 hover:text-white font-medium transition-colors">
                Discard Changes
              </button>
              <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20">
                <Save className="w-4 h-4" /> Save Rule
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <ShieldCheck className="w-16 h-16 opacity-20" />
            <p className="text-lg font-medium">Select a rule from the chain to edit</p>
            <button 
              onClick={addRule}
              className="mt-4 flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700"
            >
              <Plus className="w-4 h-4" /> Create First Rule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

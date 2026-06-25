"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Plus, Trash2, Search, X, ChevronRight, Calendar, Globe, Smartphone, Fingerprint, Activity, Lock, Shield, Zap, RefreshCw, Save, Database, AlertCircle, Clock, Info, CreditCard, CheckCircle2 } from 'lucide-react';

export type FilterField = 
  | 'destination_url' | 'slug' | 'created_at' | 'click_count' 
  | 'is_shielded' | 'country' | 'device' | 'ip_risk_score' | 'tags';

export type FilterOperator = 
  | 'equals' | 'not_equals' | 'contains' | 'not_contains' 
  | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' 
  | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null' | 'is_true' | 'is_false';

export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: any;
}

export interface FilterGroup {
  id: string;
  type: 'AND' | 'OR';
  conditions: FilterCondition[];
  groups: FilterGroup[];
}

export default function LinkFilters({ onApply }: { onApply?: (query: any) => void }) {
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const initialGroup: FilterGroup = {
    id: generateId(),
    type: 'AND',
    conditions: [
      { id: generateId(), field: 'click_count', operator: 'greater_than', value: '100' }
    ],
    groups: []
  };

  const [rootGroup, setRootGroup] = useState<FilterGroup>(initialGroup);
  const [isExpanded, setIsExpanded] = useState(true);
  const [savedFilters, setSavedFilters] = useState([
    { id: '1', name: 'High Traffic Shielded', group: null },
    { id: '2', name: 'Mobile Traffic > 50%', group: null },
    { id: '3', name: 'Suspicious IP Sources', group: null }
  ]);

  const fieldDefinitions: Record<FilterField, { label: string, icon: React.ReactNode, operators: FilterOperator[], type: 'text' | 'number' | 'date' | 'boolean' | 'multiselect' }> = {
    destination_url: { 
      label: 'Destination URL', 
      icon: <Globe className="w-4 h-4 text-blue-400" />,
      operators: ['contains', 'not_contains', 'equals', 'not_equals', 'starts_with', 'ends_with'],
      type: 'text'
    },
    slug: { 
      label: 'Short Link (Slug)', 
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      operators: ['equals', 'not_equals', 'contains', 'starts_with'],
      type: 'text'
    },
    created_at: { 
      label: 'Creation Date', 
      icon: <Calendar className="w-4 h-4 text-slate-400" />,
      operators: ['greater_than', 'less_than', 'between', 'equals'],
      type: 'date'
    },
    click_count: { 
      label: 'Total Clicks', 
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      operators: ['greater_than', 'less_than', 'equals', 'between'],
      type: 'number'
    },
    is_shielded: { 
      label: 'Aegis Shield Active', 
      icon: <Shield className="w-4 h-4 text-emerald-500" />,
      operators: ['is_true', 'is_false'],
      type: 'boolean'
    },
    country: { 
      label: 'Traffic Origin (Country)', 
      icon: <Globe className="w-4 h-4 text-indigo-400" />,
      operators: ['in', 'not_in', 'equals'],
      type: 'multiselect'
    },
    device: { 
      label: 'Device Type', 
      icon: <Smartphone className="w-4 h-4 text-purple-400" />,
      operators: ['in', 'not_in', 'equals'],
      type: 'multiselect'
    },
    ip_risk_score: { 
      label: 'Avg IP Risk Score', 
      icon: <Fingerprint className="w-4 h-4 text-orange-400" />,
      operators: ['greater_than', 'less_than', 'between'],
      type: 'number'
    },
    tags: {
      label: 'Tags',
      icon: <Filter className="w-4 h-4 text-pink-400" />,
      operators: ['contains', 'not_contains', 'in', 'is_null'],
      type: 'text'
    }
  };

  const operatorLabels: Record<FilterOperator, string> = {
    equals: 'Equals exactly',
    not_equals: 'Does not equal',
    contains: 'Contains',
    not_contains: 'Does not contain',
    starts_with: 'Starts with',
    ends_with: 'Ends with',
    greater_than: 'Greater than',
    less_than: 'Less than',
    between: 'Between',
    in: 'Is one of',
    not_in: 'Is not one of',
    is_null: 'Is empty',
    is_not_null: 'Is not empty',
    is_true: 'Is True',
    is_false: 'Is False'
  };

  // Complex recursive state updates
  const addCondition = (groupId: string) => {
    setRootGroup(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const targetGroup = findGroup(clone, groupId);
      if (targetGroup) {
        targetGroup.conditions.push({
          id: generateId(),
          field: 'destination_url',
          operator: 'contains',
          value: ''
        });
      }
      return clone;
    });
  };

  const addGroup = (parentId: string) => {
    setRootGroup(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const targetGroup = findGroup(clone, parentId);
      if (targetGroup) {
        targetGroup.groups.push({
          id: generateId(),
          type: 'AND',
          conditions: [{
            id: generateId(),
            field: 'click_count',
            operator: 'greater_than',
            value: '0'
          }],
          groups: []
        });
      }
      return clone;
    });
  };

  const updateCondition = (groupId: string, conditionId: string, updates: Partial<FilterCondition>) => {
    setRootGroup(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const targetGroup = findGroup(clone, groupId);
      if (targetGroup) {
        const index = targetGroup.conditions.findIndex((c: any) => c.id === conditionId);
        if (index > -1) {
          // If field changed, reset operator and value if incompatible
          if (updates.field && updates.field !== targetGroup.conditions[index].field) {
            const newFieldType = fieldDefinitions[updates.field as FilterField].type;
            const validOperators = fieldDefinitions[updates.field as FilterField].operators;
            updates.operator = validOperators[0];
            updates.value = newFieldType === 'boolean' ? '' : '';
          }
          targetGroup.conditions[index] = { ...targetGroup.conditions[index], ...updates };
        }
      }
      return clone;
    });
  };

  const removeCondition = (groupId: string, conditionId: string) => {
    setRootGroup(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const targetGroup = findGroup(clone, groupId);
      if (targetGroup) {
        targetGroup.conditions = targetGroup.conditions.filter((c: any) => c.id !== conditionId);
      }
      return clone;
    });
  };

  const removeGroup = (parentId: string, groupIdToRemove: string) => {
    setRootGroup(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const targetGroup = findGroup(clone, parentId);
      if (targetGroup) {
        targetGroup.groups = targetGroup.groups.filter((g: any) => g.id !== groupIdToRemove);
      }
      return clone;
    });
  };

  const toggleGroupType = (groupId: string) => {
    setRootGroup(prev => {
      const clone = JSON.parse(JSON.stringify(prev));
      const targetGroup = findGroup(clone, groupId);
      if (targetGroup) {
        targetGroup.type = targetGroup.type === 'AND' ? 'OR' : 'AND';
      }
      return clone;
    });
  };

  const findGroup = (root: FilterGroup, id: string): FilterGroup | null => {
    if (root.id === id) return root;
    for (const group of root.groups) {
      const found = findGroup(group, id);
      if (found) return found;
    }
    return null;
  };

  const handleApply = () => {
    if (onApply) onApply(rootGroup);
  };

  const renderValueInput = (condition: FilterCondition, groupId: string) => {
    if (condition.operator === 'is_null' || condition.operator === 'is_not_null' || condition.operator === 'is_true' || condition.operator === 'is_false') {
      return null;
    }

    const def = fieldDefinitions[condition.field];

    if (def.type === 'boolean') return null; // handled by operator

    if (condition.operator === 'between') {
      return (
        <div className="flex items-center space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
          <input 
            type={def.type === 'number' ? 'number' : 'text'}
            value={(condition.value as any)?.start || ''}
            onChange={(e) => updateCondition(groupId, condition.id, { value: { ...condition.value, start: e.target.value } })}
            placeholder="Min"
            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-slate-500 text-sm">and</span>
          <input 
            type={def.type === 'number' ? 'number' : 'text'}
            value={(condition.value as any)?.end || ''}
            onChange={(e) => updateCondition(groupId, condition.id, { value: { ...condition.value, end: e.target.value } })}
            placeholder="Max"
            className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      );
    }

    return (
      <input 
        type={def.type === 'number' ? 'number' : def.type === 'date' ? 'date' : 'text'}
        value={condition.value || ''}
        onChange={(e) => updateCondition(groupId, condition.id, { value: e.target.value })}
        placeholder="Enter value..."
        className="w-full sm:w-48 mt-2 sm:mt-0 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500"
      />
    );
  };

  const renderGroup = (group: FilterGroup, parentId: string | null = null, depth = 0) => {
    return (
      <div 
        key={group.id} 
        className={`relative rounded-xl border ${depth === 0 ? 'border-transparent' : 'border-slate-800 bg-slate-900/30 p-4 mt-4 ml-4'}`}
      >
        {/* Connection Line to Parent */}
        {depth > 0 && (
          <div className="absolute top-0 -left-4 w-4 h-px bg-slate-800" />
        )}

        <div className="flex flex-col space-y-3">
          {/* AND/OR Toggle + Group Actions */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => toggleGroupType(group.id)}
                className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-colors ${
                  group.type === 'AND' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                {group.type}
              </button>
              {depth === 0 && <span className="text-sm font-medium text-slate-400">Match all of the following rules:</span>}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => addCondition(group.id)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center space-x-1 transition-colors border border-slate-700"
              >
                <Plus className="w-3 h-3" /> <span>Rule</span>
              </button>
              <button 
                onClick={() => addGroup(group.id)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg flex items-center space-x-1 transition-colors border border-slate-700"
              >
                <Plus className="w-3 h-3" /> <span>Group</span>
              </button>
              {depth > 0 && parentId && (
                <button 
                  onClick={() => removeGroup(parentId, group.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <AnimatePresence>
              {group.conditions.map((condition, idx) => (
                <motion.div 
                  key={condition.id}
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  exit={{ opacity: 0, scale: 0.95, height: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center p-3 bg-slate-900 border border-slate-800 rounded-xl relative group/cond"
                >
                  {/* Visual connector line within group */}
                  {idx > 0 && (
                    <div className="absolute -top-3 left-6 w-px h-3 bg-slate-800" />
                  )}
                  {idx > 0 && (
                    <div className="absolute -top-3 left-4 bg-slate-950 px-1 text-[10px] font-bold text-slate-600 rounded">
                      {group.type}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    
                    {/* Field Selector */}
                    <div className="relative w-full sm:w-auto sm:min-w-[200px]">
                      <select 
                        value={condition.field}
                        onChange={(e) => updateCondition(group.id, condition.id, { field: e.target.value as FilterField })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        {Object.entries(fieldDefinitions).map(([key, def]) => (
                          <option key={key} value={key}>{def.label}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {fieldDefinitions[condition.field].icon}
                      </div>
                    </div>

                    {/* Operator Selector */}
                    <div className="w-full sm:w-auto sm:min-w-[150px]">
                      <select 
                        value={condition.operator}
                        onChange={(e) => updateCondition(group.id, condition.id, { operator: e.target.value as FilterOperator })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-1 focus:ring-blue-500 appearance-none"
                      >
                        {fieldDefinitions[condition.field].operators.map(op => (
                          <option key={op} value={op}>{operatorLabels[op]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Value Input */}
                    <div className="flex-1 w-full sm:w-auto">
                      {renderValueInput(condition, group.id)}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button 
                    onClick={() => removeCondition(group.id, condition.id)}
                    className="absolute right-2 top-2 sm:static sm:ml-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover/cond:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty State for Group */}
            {group.conditions.length === 0 && group.groups.length === 0 && (
              <div className="p-4 border border-dashed border-slate-700 rounded-xl text-center text-sm text-slate-500">
                Empty filter group. Add a rule to begin.
              </div>
            )}
          </div>

          {/* Nested Groups */}
          {group.groups.map(subGroup => renderGroup(subGroup, group.id, depth + 1))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
      
      {/* Header */}
      <div 
        className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Filter className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Advanced Query Builder</h3>
            <p className="text-xs text-slate-400 mt-0.5">Construct complex multi-layered data filters.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            {rootGroup.conditions.length + rootGroup.groups.length} active rules
          </span>
          <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col md:flex-row border-b border-slate-800">
              
              {/* Left Sidebar: Saved Filters */}
              <div className="w-full md:w-64 bg-slate-900/30 border-r border-slate-800 p-4 shrink-0 max-h-[500px] overflow-y-auto">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Saved Queries</div>
                <div className="space-y-1">
                  {savedFilters.map(sf => (
                    <button key={sf.id} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center space-x-2">
                      <Save className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{sf.name}</span>
                    </button>
                  ))}
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors border border-dashed border-slate-700 hover:border-blue-500/30 mt-2 flex items-center justify-center space-x-2">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Current Query</span>
                  </button>
                </div>

                <div className="mt-8">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Quick Toggles</div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3 px-2 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-blue-500/50" />
                      <span className="text-sm text-slate-300">Only Active Links</span>
                    </label>
                    <label className="flex items-center space-x-3 px-2 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/50" />
                      <span className="text-sm text-slate-300 flex items-center space-x-1">
                        <Shield className="w-3 h-3 text-emerald-400" /> <span>Shielded Only</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Area: Builder */}
              <div className="flex-1 p-6 bg-slate-950 max-h-[600px] overflow-y-auto custom-scrollbar relative">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
                  <Database className="w-64 h-64 text-blue-500" />
                </div>
                
                <div className="relative z-10">
                  {renderGroup(rootGroup)}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <button 
                onClick={() => setRootGroup(initialGroup)}
                className="text-sm text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
              >
                <RefreshCw className="w-4 h-4" /> <span>Reset Filter</span>
              </button>
              
              <div className="flex space-x-3">
                <div className="hidden sm:flex items-center px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="font-mono text-xs text-slate-500 truncate max-w-xs">
                    SELECT * FROM links WHERE ...
                  </span>
                </div>
                <button 
                  onClick={handleApply}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Execute Query</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

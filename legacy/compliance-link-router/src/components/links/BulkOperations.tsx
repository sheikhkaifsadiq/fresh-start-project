"use client";

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { 
  UploadCloud, FileText, CheckCircle, AlertTriangle, 
  X, Play, Database, Server, Loader2, ArrowRight, Table, Shield
} from 'lucide-react';

interface ParsedRow {
  destination_url: string;
  slug?: string;
  tags?: string;
  is_shielded?: string;
  [key: string]: string | undefined;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  row: ParsedRow;
}

export default function BulkOperations() {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({
    destination_url: '',
    slug: '',
    tags: '',
    is_shielded: ''
  });
  const [headers, setHeaders] = useState<string[]>([]);
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Upload, 2: Map, 3: Validate, 4: Process
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Basic CSV Parser
  const parseCSV = (text: string) => {
    const lines = text.split('\\n').filter(line => line.trim());
    if (lines.length < 2) return;
    
    // Simple split by comma, ignoring commas inside quotes (basic implementation)
    const splitRegex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    
    const parsedHeaders = lines[0].split(splitRegex).map(h => h.replace(/^"|"$/g, '').trim());
    setHeaders(parsedHeaders);
    
    // Auto-map if headers match exactly or closely
    const autoMap: Record<string, string> = { ...columnMap };
    parsedHeaders.forEach(h => {
      const lowerH = h.toLowerCase();
      if (lowerH.includes('url') || lowerH.includes('destination') || lowerH.includes('link')) autoMap.destination_url = h;
      if (lowerH.includes('slug') || lowerH.includes('short') || lowerH.includes('back-half')) autoMap.slug = h;
      if (lowerH.includes('tag')) autoMap.tags = h;
      if (lowerH.includes('shield') || lowerH.includes('protect')) autoMap.is_shielded = h;
    });
    setColumnMap(autoMap);

    const rows = lines.slice(1).map(line => {
      const values = line.split(splitRegex).map(v => v.replace(/^"|"$/g, '').trim());
      const rowObj: ParsedRow = { destination_url: '' }; // Required fallback
      parsedHeaders.forEach((header, index) => {
        rowObj[header] = values[index] || '';
      });
      return rowObj;
    });
    
    setParsedData(rows);
    setStep(2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setRawText(text);
      parseCSV(text);
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        parseCSV(text);
      };
      reader.readAsText(droppedFile);
    }
  };

  const validateData = () => {
    setIsProcessing(true);
    
    // Simulate complex validation delay
    setTimeout(() => {
      const results: ValidationResult[] = parsedData.map((row, index) => {
        const errors: string[] = [];
        const mappedRow: ParsedRow = { destination_url: '' };
        
        // Map fields
        const destUrlCol = columnMap.destination_url;
        if (destUrlCol && row[destUrlCol]) {
          mappedRow.destination_url = row[destUrlCol];
          // Validate URL
          try {
            new URL(mappedRow.destination_url);
          } catch {
            errors.push(`Row ${index + 2}: Invalid URL format in "${mappedRow.destination_url}"`);
          }
        } else {
          errors.push(`Row ${index + 2}: Missing Destination URL`);
        }

        const slugCol = columnMap.slug;
        if (slugCol && row[slugCol]) {
          mappedRow.slug = row[slugCol];
          if (!/^[a-zA-Z0-9-_]+$/.test(mappedRow.slug)) {
            errors.push(`Row ${index + 2}: Slug contains invalid characters`);
          }
        }

        const tagCol = columnMap.tags;
        if (tagCol && row[tagCol]) {
          mappedRow.tags = row[tagCol];
        }

        const shieldCol = columnMap.is_shielded;
        if (shieldCol && row[shieldCol]) {
          mappedRow.is_shielded = row[shieldCol];
        }

        return {
          valid: errors.length === 0,
          errors,
          row: mappedRow
        };
      });

      setValidationResults(results);
      setIsProcessing(false);
      setStep(3);
    }, 1000);
  };

  const processImport = async () => {
    const validRows = validationResults.filter(r => r.valid).map(r => r.row);
    if (validRows.length === 0) return;

    setIsProcessing(true);
    setStep(4);
    setProgress({ total: validRows.length, current: 0, success: 0, failed: 0 });

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      // We process in small batches to respect rate limits and DB throughput
      const batchSize = 50;
      let current = 0;
      let successCount = 0;
      let failedCount = 0;

      while (current < validRows.length) {
        const batch = validRows.slice(current, current + batchSize);
        
        const payload = batch.map(row => ({
          user_id: userData.user.id,
          destination_url: row.destination_url,
          slug: row.slug || Math.random().toString(36).substring(2, 9),
          active: true,
          click_count: 0,
          metadata: {
            tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
            protection: {
              is_shielded: row.is_shielded?.toLowerCase() === 'true' || row.is_shielded === '1' || true
            }
          }
        }));

        const { error } = await supabase.from('links').insert(payload);
        
        if (error) {
          console.error("Batch insert failed:", error);
          failedCount += batch.length;
        } else {
          successCount += batch.length;
        }

        current += batch.length;
        setProgress({ total: validRows.length, current, success: successCount, failed: failedCount });
        
        // Artificial delay to not slam the DB
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error("Fatal import error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setRawText('');
    setParsedData([]);
    setValidationResults([]);
    setStep(1);
    setProgress({ total: 0, current: 0, success: 0, failed: 0 });
  };

  return (
    <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
      
      {/* Header with Progress Steps */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-500" />
            <span>Mass Ingestion Pipeline</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">Upload and process thousands of routing pathways simultaneously.</p>
        </div>

        <div className="flex items-center mt-4 md:mt-0 space-x-2">
          {[1, 2, 3, 4].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                step === s ? 'border-blue-500 bg-blue-500/20 text-blue-400' :
                step > s ? 'border-emerald-500 bg-emerald-500 text-white' :
                'border-slate-700 bg-slate-800 text-slate-500'
              }`}>
                {step > s ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 4 && <div className={`w-8 h-1 ${step > s ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 p-8 flex flex-col items-center justify-center"
            >
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="w-full max-w-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 bg-slate-900/50 hover:bg-slate-900 transition-all rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="absolute inset-0 bg-blue-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-xl border border-slate-700 group-hover:scale-110 group-hover:border-blue-500/30 transition-all">
                  <UploadCloud className="w-10 h-10 text-blue-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">Drop your CSV matrix here</h3>
                <p className="text-slate-400 max-w-md mx-auto mb-6">
                  Standard format supported. Includes automatic header detection and data validation before ingestion.
                </p>
                
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                  Browse Files
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".csv" 
                  className="hidden" 
                />
              </div>

              <div className="mt-8 flex items-center space-x-8 text-sm text-slate-500">
                <div className="flex items-center space-x-2"><Table className="w-4 h-4" /> <span>Max 100,000 rows</span></div>
                <div className="flex items-center space-x-2"><Server className="w-4 h-4" /> <span>Batch Processing</span></div>
                <div className="flex items-center space-x-2"><Shield className="w-4 h-4" /> <span>Auto-Compliance</span></div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: MAP COLUMNS */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white">Map Data Architecture</h3>
                  <p className="text-sm text-slate-400">Match your CSV columns to Aegis Route properties.</p>
                </div>
                <div className="text-sm font-medium text-blue-400 bg-blue-500/10 px-4 py-2 rounded-lg border border-blue-500/20">
                  Detected {parsedData.length} rows
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Mapping Form */}
                  <div className="space-y-4">
                    {[
                      { key: 'destination_url', label: 'Destination URL (Required)', required: true },
                      { key: 'slug', label: 'Custom Back-half (Optional)', required: false },
                      { key: 'tags', label: 'Tags (Optional)', required: false },
                      { key: 'is_shielded', label: 'Enable Shield (Optional)', required: false }
                    ].map(field => (
                      <div key={field.key} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
                          <span>{field.label}</span>
                          {field.required && <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded">Required</span>}
                        </label>
                        <select
                          value={columnMap[field.key] || ''}
                          onChange={(e) => setColumnMap(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="">-- Ignore this field --</option>
                          {headers.map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Data Preview */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50 font-semibold text-slate-300 text-sm flex items-center space-x-2">
                      <Table className="w-4 h-4" />
                      <span>Data Preview (First 5 rows)</span>
                    </div>
                    <div className="overflow-x-auto flex-1 p-4">
                      <table className="w-full text-left text-xs whitespace-nowrap text-slate-400">
                        <thead>
                          <tr>
                            {headers.map(h => (
                              <th key={h} className="pb-3 pr-4 font-mono text-slate-500">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {parsedData.slice(0, 5).map((row, i) => (
                            <tr key={i}>
                              {headers.map(h => (
                                <td key={h} className="py-2 pr-4 truncate max-w-[150px]">{row[h] || '-'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                <button onClick={reset} className="px-6 py-2.5 text-slate-400 hover:text-white font-medium transition-colors">
                  Cancel
                </button>
                <button 
                  onClick={validateData}
                  disabled={!columnMap.destination_url || isProcessing}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>Run Validation Pipeline</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: VALIDATE */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 flex flex-col"
            >
               <div className="p-6 bg-slate-900/50 border-b border-slate-800">
                <h3 className="text-lg font-bold text-white">Validation Results</h3>
                <p className="text-sm text-slate-400">Review errors before processing ingestion.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-black text-white">{validationResults.length}</span>
                    <span className="text-sm text-slate-400 mt-1 uppercase tracking-wider font-semibold">Total Rows</span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-black text-emerald-400">{validationResults.filter(r => r.valid).length}</span>
                    <span className="text-sm text-emerald-500 mt-1 uppercase tracking-wider font-semibold">Valid (Ready)</span>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-xl flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-black text-red-400">{validationResults.filter(r => !r.valid).length}</span>
                    <span className="text-sm text-red-500 mt-1 uppercase tracking-wider font-semibold">Errors Found</span>
                  </div>
                </div>

                {validationResults.filter(r => !r.valid).length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                     <div className="p-4 border-b border-slate-800 bg-red-500/5 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h4 className="font-semibold text-white">Error Log</h4>
                     </div>
                     <div className="max-h-[250px] overflow-y-auto p-4 space-y-2">
                       {validationResults.filter(r => !r.valid).flatMap(r => r.errors).map((err, i) => (
                         <div key={i} className="text-sm text-red-400 font-mono bg-red-400/5 px-3 py-2 rounded">
                           {err}
                         </div>
                       ))}
                     </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                <button onClick={() => setStep(2)} className="px-6 py-2.5 text-slate-400 hover:text-white font-medium transition-colors">
                  Back
                </button>
                <button 
                  onClick={processImport}
                  disabled={validationResults.filter(r => r.valid).length === 0}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>Ingest {validationResults.filter(r => r.valid).length} Valid Rows</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PROCESSING */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-slate-950 relative overflow-hidden"
            >
              {/* Animated Background Grids */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgTCA0MCAwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMzcsIDk5LCAyMzUsIDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)] opacity-50 z-0 animate-[pulse_4s_ease-in-out_infinite]" />

              <div className="z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                
                {isProcessing ? (
                  <>
                    <div className="flex flex-col items-center text-center space-y-4 mb-8">
                      <div className="relative">
                        <div className="w-20 h-20 border-4 border-slate-800 rounded-full"></div>
                        <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        <Database className="w-8 h-8 text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Ingesting Matrix...</h3>
                        <p className="text-sm text-slate-400 mt-1">Routing batches through Aegis Shield</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-mono text-slate-300">
                        <span>Progress</span>
                        <span>{Math.round((progress.current / progress.total) * 100) || 0}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-500"
                          initial={{ width: '0%' }}
                          animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 mt-2">
                        <span className="text-emerald-500">{progress.success} Successful</span>
                        <span className="text-red-500">{progress.failed} Failed</span>
                        <span>{progress.current} / {progress.total} Processed</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center space-y-6">
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                      className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500/30"
                    >
                      <CheckCircle className="w-12 h-12 text-emerald-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Ingestion Complete</h3>
                      <p className="text-slate-400">Successfully injected <span className="text-emerald-400 font-bold">{progress.success}</span> new routing pathways into the core database.</p>
                      {progress.failed > 0 && (
                        <p className="text-red-400 mt-2 text-sm text-center">Failed to inject {progress.failed} rows.</p>
                      )}
                    </div>
                    <button 
                      onClick={reset}
                      className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded-xl transition-colors"
                    >
                      Process Another Batch
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

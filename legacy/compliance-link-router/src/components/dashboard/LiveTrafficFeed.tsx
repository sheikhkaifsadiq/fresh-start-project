'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LiveEvent {
  id: string;
  score: number;
  label: 'bot' | 'human' | 'uncertain';
  ip: string;
  timestamp: number;
  inferenceMs: number;
}

/**
 * Live Neural Network Traffic Feed
 * Connects to the SSE endpoint and streams real-time classification events.
 * Displays an animated scrolling feed with color-coded bot/human labels.
 */
export function LiveTrafficFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('/api/live-stats');
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'connected') return;
        if (data.type === 'classification') {
          setEvents(prev => [
            { ...data, id: crypto.randomUUID() },
            ...prev.slice(0, 49), // Keep last 50 events
          ]);
        }
      } catch {}
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Live Neural Inference Stream</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-400">{connected ? 'LIVE' : 'DISCONNECTED'}</span>
        </div>
      </div>

      <div className="h-[320px] overflow-hidden relative">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
            <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="text-sm">Waiting for live traffic...</p>
          </div>
        ) : (
          <div className="p-3 space-y-2 overflow-y-auto h-full">
            <AnimatePresence initial={false}>
              {events.map(event => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-xs font-mono ${
                    event.label === 'bot'
                      ? 'bg-red-500/5 border-red-500/20 text-red-300'
                      : event.label === 'uncertain'
                      ? 'bg-amber-500/5 border-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    event.label === 'bot' ? 'bg-red-400' : event.label === 'uncertain' ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  <span className="flex-1 text-gray-300">{event.ip ?? '0.0.0.0'}</span>
                  <span className={`font-bold uppercase tracking-widest ${
                    event.label === 'bot' ? 'text-red-400' : event.label === 'uncertain' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>{event.label}</span>
                  <span className="text-gray-500">{(event.score * 100).toFixed(1)}%</span>
                  <span className="text-gray-600">{event.inferenceMs}ms</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

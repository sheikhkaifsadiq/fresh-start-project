'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Terminal, Code2, Webhook, Zap, FileJson, ArrowRight } from 'lucide-react'

const sections = [
  { id: 1, title: 'Getting Started', description: 'Quickstart guide to integrating AegisRoute into your Next.js application.', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 2, title: 'REST API Reference', description: 'Complete documentation for the AegisRoute REST endpoints and authentication.', icon: Terminal, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 3, title: 'Edge Functions', description: 'Learn how to write custom Vercel Edge Middleware for intelligent routing.', icon: Code2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 4, title: 'Webhooks', description: 'Listen to real-time events for link clicks, bot blocks, and ML threats.', icon: Webhook, color: 'text-rose-400', bg: 'bg-rose-400/10' },
]

export default function DocsPage() {
  return (
    <div className="w-full h-full max-w-7xl mx-auto space-y-12 pb-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 pt-8"
      >
        <div className="w-20 h-20 rounded-3xl bg-violet-500/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(139,92,246,0.15)]">
          <BookOpen className="w-10 h-10 text-violet-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
          Developer <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Documentation</span>
        </h1>
        <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
          Everything you need to build, scale, and secure your routing infrastructure. Explore our APIs, SDKs, and Edge examples.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        {sections.map((section, i) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.4 }}
            className="group cursor-pointer p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-violet-500/30 transition-all duration-300 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-500/10 transition-colors duration-500" />
            
            <div className="relative z-10 flex items-start gap-6">
              <div className={`p-4 rounded-2xl ${section.bg} shrink-0`}>
                <section.icon className={`w-8 h-8 ${section.color}`} />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-xl font-semibold text-white flex items-center justify-between">
                  {section.title}
                  <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                </h3>
                <p className="text-foreground/60 leading-relaxed">
                  {section.description}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Code Snippet Example */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="rounded-3xl border border-white/10 bg-[#0c0a15] overflow-hidden"
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="ml-4 flex items-center gap-2 text-xs text-foreground/40 font-mono">
            <FileJson className="w-3.5 h-3.5" />
            aegis-config.json
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <pre className="text-sm font-mono leading-relaxed text-indigo-300">
            <code>
{`{
  "version": "1.0",
  "routing": {
    "strategy": "lowest-latency",
    "fallback": "https://default.url"
  },
  "security": {
    "ml_bot_protection": true,
    "strict_geo_fencing": ["US", "CA", "EU"]
  }
}`}
            </code>
          </pre>
        </div>
      </motion.div>
    </div>
  )
}

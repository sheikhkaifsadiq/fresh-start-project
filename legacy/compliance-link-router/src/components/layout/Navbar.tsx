'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Search, Command, Shield, Activity, ChevronDown,
  Settings, LogOut, User, Zap,
} from 'lucide-react'

export default function Navbar() {
  const [time, setTime] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen]   = useState(false)

  const notifRef = React.useRef<HTMLDivElement>(null)
  const profileRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setUserOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] h-16 flex items-center px-6 gap-4 bg-background/80 backdrop-blur-md border-b border-white/5"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
        <Shield className="w-6 h-6 text-indigo-500 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
        <span className="font-bold text-lg text-foreground tracking-tight">
          AegisRoute
        </span>
      </Link>

      {/* Engine Status */}
      <div
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Engine: ONLINE
      </div>

      {/* Live clock */}
      <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-foreground/40 flex-shrink-0">
        <Activity className="w-3 h-3 text-indigo-400" />
        {time}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command Palette Trigger */}
      <button
        className="hidden md:flex items-center gap-2 px-3 h-8 rounded-lg text-xs text-foreground/40 transition-all duration-200 hover:text-white hover:bg-white/5 border border-white/5"
        onClick={() => {}}
      >
        <Command className="w-3 h-3" />
        <span>Search...</span>
        <kbd className="ml-1 text-[10px] px-1 py-0.5 rounded bg-white/5 text-foreground/30">⌘K</kbd>
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          className="relative p-2 rounded-lg text-foreground/50 hover:text-white hover:bg-white/5 transition-all duration-200"
          onClick={() => {
            setNotifOpen(!notifOpen)
            setUserOpen(false)
          }}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>
        <AnimatePresence>
          {notifOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-80 bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4 z-[110]"
            >
              <h3 className="text-sm font-semibold text-white mb-3">Notifications</h3>
              <div className="space-y-3">
                <div className="flex gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-white">Bot Attack Blocked</p>
                    <p className="text-foreground/50 text-xs">Blocked 1.2k req/s from Tor exit nodes.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Profile */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => {
            setUserOpen(!userOpen)
            setNotifOpen(false)
          }}
          className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-lg transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-400" />
          </div>
          <ChevronDown className="w-4 h-4 text-foreground/50" />
        </button>
        <AnimatePresence>
          {userOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 bg-background/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl py-2 z-[110]"
            >
              <div className="px-4 py-2 border-b border-white/5 mb-1">
                <p className="text-sm font-semibold text-white">Admin User</p>
                <p className="text-xs text-foreground/50 truncate">admin@aegisroute.com</p>
              </div>
              <Link href="/settings" onClick={() => setUserOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/70 hover:text-white hover:bg-white/5">
                <Settings className="w-4 h-4" /> Settings
              </Link>
              <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-white/5" onClick={() => setUserOpen(false)}>
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

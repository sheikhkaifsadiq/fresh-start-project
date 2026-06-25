'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Link2, GitBranch, BarChart3, Brain, Shield,
  FileText, Settings, BookOpen, ChevronLeft, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',    shortcut: '⌘1', color: '#6366f1' }, // Indigo
  { href: '/links',      icon: Link2,           label: 'Links',         shortcut: '⌘2', color: '#a855f7' }, // Purple
  { href: '/rules',      icon: GitBranch,       label: 'Rules',         shortcut: '⌘3', color: '#ec4899' }, // Pink
  { href: '/analytics',  icon: BarChart3,       label: 'Analytics',     shortcut: '⌘4', color: '#f43f5e' }, // Rose
  { href: '/ml-engine',  icon: Brain,           label: 'ML Engine',     shortcut: '⌘5', color: '#f59e0b' }, // Amber
  { href: '/security',   icon: Shield,          label: 'Security',      shortcut: '⌘6', color: '#10b981' }, // Emerald
  { href: '/audit-logs', icon: FileText,        label: 'Audit Logs',    shortcut: '⌘7', color: '#06b6d4' }, // Cyan
  { href: '/settings',   icon: Settings,        label: 'Settings',      shortcut: '⌘8', color: '#64748b' }, // Slate
  { href: '/docs',       icon: BookOpen,        label: 'Documentation', shortcut: '⌘9', color: '#8b5cf6' }, // Violet
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <aside
      className="h-full z-40 flex flex-col transition-all duration-300 ease-in-out liquid-glass overflow-hidden shrink-0"
      style={{
        width: collapsed ? '64px' : '220px',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 liquid-glass border border-white/10"
      >
        {collapsed
          ? <ChevronRight className="w-3 h-3 text-white" />
          : <ChevronLeft  className="w-3 h-3 text-white" />}
      </button>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 px-2">
        {!collapsed && (
          <p className="px-3 mb-4 text-[10px] font-semibold uppercase tracking-widest text-foreground/30 font-mono">
            Platform Menu
          </p>
        )}

        {navItems.map(({ href, icon: Icon, label, shortcut, color }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className="group relative flex items-center gap-3 rounded-xl transition-all duration-200"
              style={{
                padding: collapsed ? '10px 12px' : '10px 14px',
                background: active
                  ? `rgba(255, 255, 255, 0.05)`
                  : 'transparent',
                border: active
                  ? `1px solid rgba(255, 255, 255, 0.1)`
                  : '1px solid transparent',
              }}
            >
              {/* Active indicator */}
              {active && (
                <span
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                  style={{ background: color, boxShadow: `0 0 10px ${color}` }}
                />
              )}

              <Icon
                className="w-4 h-4 flex-shrink-0 transition-all duration-200"
                style={{ color: active ? color : 'rgba(255,255,255,0.4)' }}
              />

              {!collapsed && (
                <>
                  <span
                    className="flex-1 text-sm font-medium truncate transition-colors duration-200 text-foreground/80 group-hover:text-white"
                    style={{ color: active ? 'white' : undefined }}
                  >
                    {label}
                  </span>
                  {active && (
                    <span className="text-[10px] text-white/30 font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                      {shortcut}
                    </span>
                  )}
                </>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer area */}
      <div className="p-4 border-t border-white/5">
        {!collapsed ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 font-bold text-sm shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              S
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Startup Plan</p>
              <p className="text-xs text-emerald-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
                All Systems Normal
              </p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 font-bold text-sm">
            S
          </div>
        )}
      </div>
    </aside>
  )
}

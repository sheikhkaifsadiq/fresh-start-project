'use client'

import React from 'react'
import { Shield, Key, Smartphone, Monitor } from 'lucide-react'

export default function SecuritySettings() {
  return (
    <div className="space-y-6">
      {/* 2FA */}
      <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Two-Factor Authentication</h3>
              <p className="text-sm text-white/40 mt-1 max-w-lg">
                Add an extra layer of security to your account by requiring a code from an authenticator app when logging in.
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all">
            Enable 2FA
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Key className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Password</h3>
              <p className="text-sm text-white/40 mt-1 max-w-lg">
                Update your password to keep your account secure.
              </p>
            </div>
          </div>
        </div>
        
        <div className="space-y-4 max-w-md ml-14">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">Current Password</label>
            <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/60">New Password</label>
            <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors" />
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 mt-2">
            Update Password
          </button>
        </div>
      </div>

      {/* Sessions */}
      <div className="liquid-glass border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <h3 className="font-medium text-white">Active Sessions</h3>
          <p className="text-sm text-white/40 mt-1">Manage the devices that are currently logged into your account.</p>
        </div>
        <div className="divide-y divide-white/5">
          <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
              <Monitor className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-sm font-medium text-white">Mac OS • Chrome</p>
                <p className="text-xs text-white/40">104.21.5.12 • Active now</p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full font-medium">Current Session</span>
          </div>
          <div className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-4">
              <Smartphone className="w-5 h-5 text-white/30" />
              <div>
                <p className="text-sm font-medium text-white">iOS • Safari</p>
                <p className="text-xs text-white/40">72.14.200.5 • Last active 2h ago</p>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-medium text-red-400 transition-all">
              Revoke
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

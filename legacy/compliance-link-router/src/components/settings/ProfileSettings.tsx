"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  Mail,
  Lock,
  Smartphone,
  Shield,
  Upload,
  Camera,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  LogOut,
  MonitorSmartphone,
  MapPin,
  Clock
} from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  timezone: z.string().optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Must contain uppercase").regex(/[0-9]/, "Must contain number").regex(/[^A-Za-z0-9]/, "Must contain special character"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState<"general" | "security" | "sessions">("general");
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const { control: profileControl, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "Jane Doe",
      email: "jane.doe@example.com",
      company: "Acme Corp",
      timezone: "America/New_York"
    }
  });

  const { control: passwordControl, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema)
  });

  const supabase = createClient();

  const onProfileSave = async (data: ProfileFormValues) => {
    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      // Simulate API call for huge logic feel
      await new Promise(r => setTimeout(r, 1000));
      setSuccessMsg("Profile updated successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const onPasswordSave = async (data: PasswordFormValues) => {
    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setSuccessMsg("Password changed successfully");
      resetPassword();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const mockSessions = [
    { id: 1, device: "MacBook Pro M2", browser: "Chrome 120.0.0", location: "San Francisco, US", ip: "192.168.1.1", active: true, time: "Just now" },
    { id: 2, device: "iPhone 14 Pro", browser: "Safari Mobile", location: "San Francisco, US", ip: "192.168.1.45", active: false, time: "2 hours ago" },
    { id: 3, device: "Windows Desktop", browser: "Firefox 119.0", location: "New York, US", ip: "10.0.0.12", active: false, time: "3 days ago" }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 p-6">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-blue-500" />
          Profile & Security
        </h2>
        <p className="text-zinc-400 mt-2 text-lg">
          Manage your personal information, security preferences, and active sessions.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-2 backdrop-blur-xl flex flex-col gap-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "general" ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
            >
              <User className="w-5 h-5" />
              General Profile
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "security" ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
            >
              <Shield className="w-5 h-5" />
              Security & Auth
            </button>
            <button
              onClick={() => setActiveTab("sessions")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === "sessions" ? "bg-blue-500/10 text-blue-400" : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"}`}
            >
              <MonitorSmartphone className="w-5 h-5" />
              Active Sessions
            </button>
          </div>
        </div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">{successMsg}</span>
              </motion.div>
            )}

            {activeTab === "general" && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-xl font-semibold text-white mb-6">Profile Picture</h3>
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-1">
                        <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center overflow-hidden">
                          <User className="w-10 h-10 text-zinc-500" />
                        </div>
                      </div>
                      <button className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-6 h-6 text-white mb-1" />
                        <span className="text-[10px] text-white font-medium">Change</span>
                      </button>
                    </div>
                    <div>
                      <div className="flex gap-3">
                        <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          Upload New
                        </button>
                        <button className="px-4 py-2 text-red-400 hover:bg-red-500/10 text-sm font-medium rounded-xl transition-colors">
                          Remove
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500 mt-3">JPG, GIF or PNG. Max size of 2MB.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-xl font-semibold text-white mb-6">Personal Information</h3>
                  <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Full Name</label>
                        <Controller
                          name="fullName"
                          control={profileControl}
                          render={({ field }) => (
                            <input {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                          )}
                        />
                        {profileErrors.fullName && <p className="text-red-400 text-xs">{profileErrors.fullName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email Address</label>
                        <Controller
                          name="email"
                          control={profileControl}
                          render={({ field }) => (
                            <div className="relative">
                              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                              <input {...field} disabled className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-400 outline-none cursor-not-allowed" />
                            </div>
                          )}
                        />
                        <p className="text-xs text-zinc-500">Contact support to change your email.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Company</label>
                        <Controller
                          name="company"
                          control={profileControl}
                          render={({ field }) => (
                            <input {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Timezone</label>
                        <Controller
                          name="timezone"
                          control={profileControl}
                          render={({ field }) => (
                            <select {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                              <option value="America/New_York">Eastern Time (US & Canada)</option>
                              <option value="America/Chicago">Central Time (US & Canada)</option>
                              <option value="America/Denver">Mountain Time (US & Canada)</option>
                              <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                              <option value="Europe/London">London</option>
                              <option value="Europe/Paris">Paris</option>
                              <option value="Asia/Tokyo">Tokyo</option>
                            </select>
                          )}
                        />
                      </div>
                    </div>
                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-xl font-semibold text-white mb-6">Two-Factor Authentication</h3>
                  <div className="flex items-start justify-between gap-4 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">Authenticator App</h4>
                        <p className="text-sm text-zinc-400 mt-1 max-w-md">
                          Use an authenticator app like Google Authenticator or Authy to generate one-time security codes.
                        </p>
                        {twoFactorEnabled && (
                          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Enabled
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${twoFactorEnabled ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                    >
                      {twoFactorEnabled ? 'Disable' : 'Enable 2FA'}
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-xl font-semibold text-white mb-6">Change Password</h3>
                  <form onSubmit={handlePasswordSubmit(onPasswordSave)} className="space-y-5">
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Current Password</label>
                        <Controller
                          name="currentPassword"
                          control={passwordControl}
                          render={({ field }) => (
                            <input type="password" {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                          )}
                        />
                        {passwordErrors.currentPassword && <p className="text-red-400 text-xs">{passwordErrors.currentPassword.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">New Password</label>
                        <Controller
                          name="newPassword"
                          control={passwordControl}
                          render={({ field }) => (
                            <input type="password" {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                          )}
                        />
                        {passwordErrors.newPassword && <p className="text-red-400 text-xs">{passwordErrors.newPassword.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Confirm New Password</label>
                        <Controller
                          name="confirmPassword"
                          control={passwordControl}
                          render={({ field }) => (
                            <input type="password" {...field} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                          )}
                        />
                        {passwordErrors.confirmPassword && <p className="text-red-400 text-xs">{passwordErrors.confirmPassword.message}</p>}
                      </div>
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === "sessions" && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white">Device History</h3>
                      <p className="text-sm text-zinc-400 mt-1">Devices that have logged into your account.</p>
                    </div>
                    <button className="px-4 py-2 text-red-400 hover:bg-red-500/10 text-sm font-medium rounded-xl transition-colors border border-red-500/20">
                      Sign out of all other devices
                    </button>
                  </div>

                  <div className="space-y-4">
                    {mockSessions.map(session => (
                      <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-zinc-800 rounded-xl bg-zinc-950/30">
                        <div className="flex gap-4 items-start">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${session.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}>
                            {session.device.includes("iPhone") ? <Smartphone className="w-5 h-5" /> : <MonitorSmartphone className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-white font-medium">{session.device}</h4>
                              {session.active && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                                  Current Session
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 mt-1">
                              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> {session.browser}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {session.location}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {session.time}</span>
                            </div>
                            <div className="text-xs text-zinc-600 mt-1 font-mono">{session.ip}</div>
                          </div>
                        </div>
                        {!session.active && (
                          <button className="flex items-center justify-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm w-full sm:w-auto">
                            <LogOut className="w-4 h-4" />
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

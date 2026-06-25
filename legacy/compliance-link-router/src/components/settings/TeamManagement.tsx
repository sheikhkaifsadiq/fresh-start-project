"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Users, UserPlus, Mail, Shield, ShieldAlert,
  MoreVertical, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Trash2, Edit2, Search, Filter,
  Building, MapPin, Activity, Crown,
  UserCheck, UserX, Clock, Globe
} from "lucide-react";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["owner", "admin", "member", "viewer"]),
  department: z.string().optional(),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "suspended";
  joined_at: string;
  last_active: string | null;
  department?: string;
  location?: string;
  mfa_enabled: boolean;
}

const ROLES = [
  { id: "owner", label: "Owner", description: "Full access to all resources, billing, and team management.", icon: Crown, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "admin", label: "Admin", description: "Can manage links, analytics, and most settings.", icon: ShieldAlert, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
  { id: "member", label: "Member", description: "Can create and edit their own links.", icon: UserCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "viewer", label: "Viewer", description: "Read-only access to analytics and links.", icon: Globe, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "mem_1",
      user_id: "usr_1",
      email: "jane.doe@acme.com",
      role: "owner",
      status: "active",
      joined_at: new Date(Date.now() - 31536000000).toISOString(),
      last_active: new Date().toISOString(),
      department: "Engineering",
      location: "San Francisco, CA",
      mfa_enabled: true
    },
    {
      id: "mem_2",
      user_id: "usr_2",
      email: "john.smith@acme.com",
      role: "admin",
      status: "active",
      joined_at: new Date(Date.now() - 15536000000).toISOString(),
      last_active: new Date(Date.now() - 86400000).toISOString(),
      department: "Marketing",
      location: "New York, NY",
      mfa_enabled: true
    },
    {
      id: "mem_3",
      user_id: "usr_3",
      email: "alice.jones@acme.com",
      role: "member",
      status: "invited",
      joined_at: new Date().toISOString(),
      last_active: null,
      department: "Sales",
      mfa_enabled: false
    }
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "member",
      department: ""
    }
  });

  const onSubmitInvite = async (data: InviteFormValues) => {
    setIsInviting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const newMember: TeamMember = {
        id: `mem_${Math.random().toString(36).substr(2, 9)}`,
        user_id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        email: data.email,
        role: data.role,
        status: "invited",
        joined_at: new Date().toISOString(),
        last_active: null,
        department: data.department,
        mfa_enabled: false
      };
      setMembers(prev => [newMember, ...prev]);
      setShowInviteModal(false);
      reset();
      setSuccessMsg(`Invitation sent to ${data.email}`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoke = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = member.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (member.department || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, roleFilter]);

  const getRoleBadge = (role: string) => {
    const r = ROLES.find(x => x.id === role);
    if (!r) return null;
    const Icon = r.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${r.bg} ${r.color} border-current/20`}>
        <Icon className="w-3.5 h-3.5" />
        {r.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>;
    if (status === "invited") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><Clock className="w-3.5 h-3.5" /> Pending</span>;
    if (status === "suspended") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"><XCircle className="w-3.5 h-3.5" /> Suspended</span>;
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Team Management
          </h2>
          <p className="text-zinc-400 mt-2 text-lg">
            Manage roles, permissions, and security policies for your organization.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <UserPlus className="w-5 h-5" />
          Invite Member
        </button>
      </div>

      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-400"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 text-sm font-medium">Total Members</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{members.length}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 text-sm font-medium">Active Now</h3>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{members.filter(m => m.status === 'active').length}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 text-sm font-medium">Pending Invites</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-white mt-4">{members.filter(m => m.status === 'invited').length}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <h3 className="text-zinc-400 text-sm font-medium">MFA Adoption</h3>
            <Shield className="w-5 h-5 text-fuchsia-500" />
          </div>
          <div className="mt-4 flex items-end gap-2">
            <p className="text-3xl font-bold text-white">
              {Math.round((members.filter(m => m.mfa_enabled).length / members.length) * 100)}%
            </p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col backdrop-blur-xl">
        <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <div className="relative w-full sm:w-48">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
              >
                <option value="all">All Roles</option>
                <option value="owner">Owners</option>
                <option value="admin">Admins</option>
                <option value="member">Members</option>
                <option value="viewer">Viewers</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-900/20">
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[30%]">User</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[15%]">Role</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[15%]">Status</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[15%]">Security</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[15%]">Activity</th>
                <th className="p-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider w-[10%] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-zinc-800/20 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/5 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-400">{member.email.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-medium text-zinc-200">{member.email}</div>
                        <div className="text-xs text-zinc-500 mt-1 flex items-center gap-3">
                          {member.department && (
                            <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {member.department}</span>
                          )}
                          {member.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {member.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {getRoleBadge(member.role)}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(member.status)}
                  </td>
                  <td className="p-4">
                    {member.status === 'invited' ? (
                      <span className="text-xs text-zinc-500">N/A</span>
                    ) : (
                      member.mfa_enabled ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <Shield className="w-3.5 h-3.5" /> MFA Enabled
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 tooltip-trigger relative">
                          <ShieldAlert className="w-3.5 h-3.5" /> No MFA
                        </div>
                      )
                    )}
                  </td>
                  <td className="p-4 text-sm text-zinc-400">
                    <div className="flex flex-col gap-1 text-xs">
                      {member.last_active ? (
                        <span><span className="text-zinc-500">Active:</span> {new Date(member.last_active).toLocaleDateString()}</span>
                      ) : (
                        <span><span className="text-zinc-500">Active:</span> Never</span>
                      )}
                      <span><span className="text-zinc-500">Joined:</span> {new Date(member.joined_at).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {member.status === 'invited' ? (
                        <button className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors tooltip-trigger relative" title="Resend Invite">
                          <Mail className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors tooltip-trigger relative" title="Edit Role">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      {member.role !== 'owner' && (
                        <button onClick={() => handleRevoke(member.id)} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors tooltip-trigger relative" title="Remove User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
                  <p className="text-sm text-zinc-400 mt-1">They will receive an email with a signup link.</p>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="text-zinc-500 hover:text-zinc-300">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitInvite)} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Email Address</label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input {...field} type="email" placeholder="colleague@acme.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                      </div>
                    )}
                  />
                  {errors.email && <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {errors.email.message}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-zinc-300">Role</label>
                  <div className="grid grid-cols-1 gap-3">
                    {ROLES.map((role) => (
                      <label key={role.id} className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer transition-colors group">
                        <Controller
                          name="role"
                          control={control}
                          render={({ field }) => (
                            <input
                              type="radio"
                              className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-zinc-900 border-zinc-700 text-blue-500 focus:ring-blue-500/20"
                              checked={field.value === role.id}
                              onChange={() => field.onChange(role.id)}
                            />
                          )}
                        />
                        <div className="flex-1">
                          <div className={`text-sm font-medium transition-colors flex items-center gap-2 ${role.color}`}>
                            {role.label}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1">{role.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Department (Optional)</label>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <input {...field} placeholder="e.g. Engineering" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                    )}
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-zinc-800">
                  <button type="button" onClick={() => setShowInviteModal(false)} className="px-5 py-2.5 text-zinc-300 hover:text-white font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isInviting} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
                    {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Send Invite
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

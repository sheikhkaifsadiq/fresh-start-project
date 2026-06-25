"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Shield, User, Webhook, Activity, CreditCard, Menu, Users, Zap, BrainCircuit, Bell, Route } from "lucide-react";
import ApiKeysManager from "@/components/settings/ApiKeysManager";
import SecurityLogs from "@/components/settings/SecurityLogs";
import ProfileSettings from "@/components/settings/ProfileSettings";
import WebhookSettings from "@/components/settings/WebhookSettings";
import TeamManagement from "@/components/settings/TeamManagement";
import ComplianceSettings from "@/components/settings/ComplianceSettings";
import RateLimitingSettings from "@/components/settings/RateLimitingSettings";
import MLModelConfig from "@/components/settings/MLModelConfig";
import BillingSettings from "@/components/settings/BillingSettings";
import NotificationPreferences from "@/components/settings/NotificationPreferences";
import AdvancedRoutingRules from "@/components/settings/AdvancedRoutingRules";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("api-keys");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: "profile", label: "Profile", icon: User, color: "text-blue-400", bg: "bg-blue-400/10" },
    { id: "team", label: "Team", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "api-keys", label: "API Keys", icon: Shield, color: "text-indigo-400", bg: "bg-indigo-400/10" },
    { id: "webhooks", label: "Webhooks", icon: Webhook, color: "text-fuchsia-400", bg: "bg-fuchsia-400/10" },
    { id: "audit-logs", label: "Audit Logs", icon: Activity, color: "text-rose-400", bg: "bg-rose-400/10" },
    { id: "compliance", label: "Compliance", icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "ml-engine", label: "ML Engine", icon: BrainCircuit, color: "text-violet-500", bg: "bg-violet-500/10" },
    { id: "routing", label: "Edge Routing", icon: Route, color: "text-sky-500", bg: "bg-sky-500/10" },
    { id: "rate-limits", label: "Rate Limiting", icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { id: "notifications", label: "Notifications", icon: Bell, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { id: "billing", label: "Billing", icon: CreditCard, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full max-w-[1600px] mx-auto">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 z-20">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-zinc-400" />
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-zinc-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 liquid-glass border border-white/5 rounded-xl transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:bg-transparent md:border-none md:shadow-none shadow-2xl flex-shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-zinc-400" />
            Settings
          </h1>
          <p className="text-zinc-500 text-sm mt-2">Manage your workspace</p>
        </div>

        <nav className="p-4 space-y-2 mt-16 md:mt-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? `bg-zinc-900 text-white border border-zinc-800` 
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive ? tab.bg : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? tab.color : ''}`} />
                </div>
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative w-full min-w-0">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-fuchsia-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[200px] left-[-100px] w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

        <main className="relative z-0 min-h-full pb-20">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "profile" && <ProfileSettings />}
            {activeTab === "team" && <TeamManagement />}
            {activeTab === "api-keys" && <ApiKeysManager />}
            {activeTab === "webhooks" && <WebhookSettings />}
            {activeTab === "audit-logs" && <SecurityLogs />}
            {activeTab === "compliance" && <ComplianceSettings />}
            {activeTab === "ml-engine" && <MLModelConfig />}
            {activeTab === "routing" && <AdvancedRoutingRules />}
            {activeTab === "rate-limits" && <RateLimitingSettings />}
            {activeTab === "notifications" && <NotificationPreferences />}
            {activeTab === "billing" && <BillingSettings />}
          </motion.div>
        </main>
      </div>
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-0 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

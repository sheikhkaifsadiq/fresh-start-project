import React from "react";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | Aegis Route",
  description: "Enterprise-grade compliance-shielded link routing analytics and metrics.",
};

export default function AnalyticsPage() {
  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <AnalyticsDashboard />
    </div>
  );
}
import React from 'react';
import { Metadata } from 'next';
import { Suspense } from 'react';
import LinksManagerClient from '@/components/links/LinksManagerClient';
import { createClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  title: 'Links Management | Aegis Route',
  description: 'Manage, monitor, and configure compliance-shielded routing pathways.',
};

// Next.js Server Component
export default async function LinksPage() {
  return (
    <div className="flex-1 w-full h-full min-h-screen bg-slate-950 text-slate-200">
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        <Suspense fallback={<div className="h-full flex items-center justify-center p-20"><div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /></div>}>
          <LinksManagerClient />
        </Suspense>
      </div>
    </div>
  );
}

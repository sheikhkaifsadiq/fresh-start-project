import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/admin';
import LinkDetailsClient from '@/components/links/LinkDetailsClient';

export const metadata: Metadata = {
  title: 'Link Analytics | Aegis Route',
  description: 'Deep analytics and routing diagnostics for specific links.',
};

export default async function LinkDetailsPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  
  // Server-side fetch for the initial link data
  const { data: link, error } = await supabase
    .from('links')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !link) {
    notFound();
  }

  // Fetch some aggregate analytics data server-side
  const { count: clicksCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('action', 'click')
    // We would normally join this, but we'll simulate for now
    .limit(1);

  return (
    <div className="flex-1 w-full min-h-screen bg-slate-950 text-slate-200">
      <LinkDetailsClient link={link} initialStats={{ totalClicks: clicksCount || 0 }} />
    </div>
  );
}

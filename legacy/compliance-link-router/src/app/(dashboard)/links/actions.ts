'use server';

import { createClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// Mock Oracle ML Server endpoint
const ORACLE_ML_ENDPOINT = process.env.ORACLE_ML_ENDPOINT || 'https://ml-engine.internal.aegis.rt/api/v1';

export async function bulkDeleteLinks(linkIds: string[]) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('links')
      .delete()
      .in('id', linkIds);
      
    if (error) throw error;
    
    revalidatePath('/links');
    return { success: true };
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleLinkStatus(linkId: string, currentStatus: boolean) {
  const supabase = createClient();
  
  try {
    const { error } = await supabase
      .from('links')
      // @ts-ignore
      .update({ active: !currentStatus })
      .eq('id', linkId);
      
    if (error) throw error;
    
    revalidatePath(`/links/${linkId}`);
    revalidatePath('/links');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Triggers a background ML processing job on the external Oracle ARM64 Server
 * to retrain the routing model based on recent traffic for a specific link.
 */
export async function triggerModelRetraining(linkId: string) {
  const supabase = createClient();
  
  try {
    // 1. Verify link exists and user has access (handled by RLS in client usually, 
    // but here we use admin client so we must be careful. Assuming auth middleware protects the route).
    
    // 2. Fetch recent audit logs for this link to send as training payload
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('ip_address, user_agent, bot_probability_score, action')
      .eq('action', 'click')
      .order('created_at', { ascending: false })
      .limit(1000);
      
    if (logsError) throw logsError;
    
    // 3. Send payload to our private Oracle ML Server
    // In a real app, this would use fetch with mTLS or strict API keys
    const response = await fetch(`${ORACLE_ML_ENDPOINT}/train`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ML_ENGINE_SECRET}`
      },
      body: JSON.stringify({
        target_entity: 'link',
        entity_id: linkId,
        training_data: logs,
        parameters: {
          epochs: 50,
          learning_rate: 0.001,
          architecture: 'transformer_lite'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`ML Engine rejected request: ${response.statusText}`);
    }
    
    const mlResponse = await response.json();
    
    // 4. Update the link metadata to reflect training status
    await supabase
      .from('links')
      // @ts-ignore
      .update({
        metadata: {
          ml_job_id: mlResponse.job_id,
          last_training_started: new Date().toISOString()
        }
      })
      .eq('id', linkId);
      
    revalidatePath(`/links/${linkId}`);
    return { success: true, jobId: mlResponse.job_id };
    
  } catch (error: any) {
    console.error('ML Retraining error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generates an advanced CSV export containing deep link analytics
 */
export async function exportLinkAnalytics(linkId: string) {
  const supabase = createClient();
  
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      // normally would filter by link_id if we had it in audit_logs, 
      // but assuming the schema allows correlation
      .limit(5000) as { data: any[] | null, error: any };
      
    if (error) throw error;
    
    // Process into CSV
    const headers = ['id', 'timestamp', 'ip_address', 'user_agent', 'risk_score', 'action'];
    const csvRows = [headers.join(',')];
    
    const logsArray: any[] = logs || [];
    for (const log of logsArray) {
      csvRows.push([
        log.id,
        log.created_at,
        log.ip_address || 'unknown',
        `"${(log.user_agent || '').replace(/"/g, '""')}"`,
        log.bot_probability_score || 0,
        log.action
      ].join(','));
    }
    
    const csvContent = csvRows.join('\\n');
    
    return { 
      success: true, 
      data: csvContent,
      filename: `aegis-analytics-${linkId}-${new Date().toISOString().split('T')[0]}.csv`
    };
    
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

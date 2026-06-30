"use client";

import { createClient } from "@/lib/supabase/client";

export const getAuditLogs = async (limit = 50, offset = 0) => {
  const supabase = createClient();
  const { data, error, count } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
    
  if (error) throw error;
  return { data, count };
};

export const getApiKeys = async () => {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Cryptography utilities for frontend simulation of key hashing
export const generateSecureRandomString = (length = 32) => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, length);
};

export const hashStringSHA256 = async (str: string) => {
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const parseIPRange = (ipString: string) => {
  // basic CIDR or single IP validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  const ips = ipString.split(",").map(ip => ip.trim());
  return ips.filter(ip => ipv4Regex.test(ip));
};

export const formatExpirationDate = (days: string) => {
  if (days === 'never') return null;
  const d = parseInt(days.replace('d', ''));
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date.toISOString();
};

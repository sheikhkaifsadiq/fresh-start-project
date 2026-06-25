/**
 * Real-Time ML Inference Layer
 * 
 * Fetches the active model weights from Supabase and caches them in memory.
 * Provides instant inference for incoming Edge requests via forwardPass().
 * TTL-based refresh ensures the model stays up to date without latency spikes.
 */

import { DEFAULT_WEIGHTS, forwardPass, featuresToVector } from './neural-network';
import type { MLModelWeights, TrafficFeatures } from './types';

const CACHE_TTL_MS = 60_000; // Refresh every 60 seconds

let cachedWeights: MLModelWeights = DEFAULT_WEIGHTS;
let cacheLastFetched = 0;
let isFetching = false;

async function refreshWeightsFromDB(): Promise<void> {
  if (isFetching) return;
  isFetching = true;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/ml_models?is_active=eq.true&select=weights_json,version,metadata&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        cache: 'no-store',
      }
    );

    if (!res.ok) return;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return;

    const raw = rows[0].weights_json;
    if (raw && typeof raw === 'object' && raw.hiddenLayers) {
      cachedWeights = raw as MLModelWeights;
      cacheLastFetched = Date.now();
      console.log(`[ML Engine] Active model loaded: ${rows[0].version}`);
    }
  } catch (err) {
    console.error('[ML Engine] Failed to refresh weights:', err);
  } finally {
    isFetching = false;
  }
}

export async function getActiveWeights(): Promise<MLModelWeights> {
  const now = Date.now();
  if (now - cacheLastFetched > CACHE_TTL_MS) {
    // Fire refresh in background, serve cached weights immediately
    refreshWeightsFromDB();
  }
  return cachedWeights;
}

export async function classifyTraffic(features: TrafficFeatures): Promise<{
  score: number;
  label: 'bot' | 'human' | 'uncertain';
  blocked: boolean;
  inferenceMs: number;
}> {
  const t0 = Date.now();
  const weights = await getActiveWeights();
  const vector = featuresToVector(features);
  const score = forwardPass(vector, weights);
  const inferenceMs = Date.now() - t0;

  const label = score > 0.85 ? 'bot' : score > 0.5 ? 'uncertain' : 'human';
  const blocked = score > 0.85;

  return { score, label, blocked, inferenceMs };
}

export function extractTrafficFeatures(request: Request): TrafficFeatures {
  const headers = request.headers;
  const ua = headers.get('user-agent') ?? '';
  const acceptLang = headers.get('accept-language');
  const referer = headers.get('referer');
  const secFetch = headers.get('sec-fetch-dest');
  const forwardedFor = headers.get('x-forwarded-for') ?? '0.0.0.0';
  const ip = forwardedFor.split(',')[0].trim();

  // UA entropy approximation via character variance
  const uaEntropy = ua.length > 0
    ? new Set(ua.split('')).size / Math.log(ua.length + 1)
    : 0;

  // Header order score (presence of key browser headers)
  const browserHeaders = ['accept', 'accept-language', 'accept-encoding', 'sec-fetch-dest'];
  const headerOrderScore = browserHeaders.filter(h => headers.get(h)).length / browserHeaders.length;

  const headerCount = [...(headers as any).keys()].length;

  // ASN heuristic: check if IP range looks like a cloud provider
  const cloudPrefixes = ['10.', '172.', '192.168.', '34.', '35.', '52.', '54.', '104.', '130.', '216.'];
  const isCloudIp = cloudPrefixes.some(p => ip.startsWith(p));

  return {
    ipAddress: ip,
    userAgent: ua,
    requestRatePerMin: 1, // Static per-request; velocity tracked separately
    headerCount,
    hasSecFetchHeaders: !!secFetch,
    acceptLangPresent: !!acceptLang,
    uaEntropy,
    headerOrderScore,
    connectionTimeMs: 100,
    refererPresent: !!referer,
    asnType: isCloudIp ? 'hosting' : 'isp',
    velocityScore: 1,
    geoMismatch: false,
    headlessBrowser:
      ua.includes('HeadlessChrome') ||
      ua.includes('PhantomJS') ||
      ua.includes('Selenium') ||
      ua.includes('puppeteer') ||
      ua === '',
  };
}

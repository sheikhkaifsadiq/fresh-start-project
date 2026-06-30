import { TrafficFeatures } from './types';
import type { NextRequest } from 'next/server';

/**
 * Computes Shannon entropy of a string.
 * Higher entropy = more random/complex = more likely human UA
 */
export function shannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const freq: Record<string, number> = {};
  for (const c of str) {
    freq[c] = (freq[c] || 0) + 1;
  }
  let entropy = 0;
  const len = str.length;
  for (const c in freq) {
    const p = freq[c] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Score the order of HTTP headers compared to a standard browser ordering.
 * Returns 0.0 (completely out of order / minimal) to 1.0 (matches browser ordering).
 */
function scoreHeaderOrder(headerNames: string[]): number {
  const standardOrder = [
    'host', 'connection', 'accept', 'accept-language', 'accept-encoding',
    'user-agent', 'referer', 'sec-fetch-dest', 'sec-fetch-mode',
    'sec-fetch-site', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform'
  ];
  let score = 0;
  let lastIdx = -1;
  for (const h of headerNames) {
    const idx = standardOrder.indexOf(h.toLowerCase());
    if (idx !== -1 && idx > lastIdx) {
      score++;
      lastIdx = idx;
    }
  }
  return Math.min(1, score / Math.max(standardOrder.length, 1));
}

/**
 * Extract ML features from a NextRequest.
 */
export function extractFeatures(request: NextRequest): TrafficFeatures {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLang = request.headers.get('accept-language');
  const referer = request.headers.get('referer');
  const secFetchDest = request.headers.get('sec-fetch-dest');
  const secFetchMode = request.headers.get('sec-fetch-mode');
  const secFetchSite = request.headers.get('sec-fetch-site');

  // Count headers
  const headerNames: string[] = [];
  request.headers.forEach((_, key) => headerNames.push(key));

  // Has Sec-Fetch-* headers (modern browsers always send these)
  const hasSecFetchHeaders = !!(secFetchDest && secFetchMode && secFetchSite);

  // UA entropy (0 = empty/bot, 8 = very complex/human)
  const uaEntropy = shannonEntropy(userAgent);

  // Estimate connection time from x-vercel-timing or default
  const timingHeader = request.headers.get('x-vercel-timing') || '';
  const connectionTimeMs = timingHeader ? parseFloat(timingHeader.split('=')[1] || '50') : 50;

  return {
    ipAddress: request.ip || '0.0.0.0',
    userAgent,
    requestRatePerMin: 0, // Will be enriched from Redis in middleware
    headerCount: headerNames.length,
    hasSecFetchHeaders,
    acceptLangPresent: !!acceptLang,
    uaEntropy: Math.min(8, uaEntropy),
    headerOrderScore: scoreHeaderOrder(headerNames),
    connectionTimeMs: Math.min(5000, connectionTimeMs),
    refererPresent: !!referer,
  };
}

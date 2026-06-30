import { TrafficFeatures } from './types';

// Known malicious User-Agent signatures
export const KNOWN_BAD_USER_AGENTS: string[] = [
  'python-requests', 'python-urllib', 'curl/', 'wget/', 'scrapy/', 'go-http-client',
  'apache-httpclient', 'libwww-perl', 'httpunit', 'nutch/', 'phpcrawl', 'mj12bot',
  'ahrefsbot', 'semrushbot', 'dotbot', 'rogerbot', 'blexbot', 'seznambot',
  'ia_archiver', 'facebookexternalhit', 'grub-client', 'hailoobot', 'heritrix',
  'ltx71', 'nikto', 'scaninfo', 'sqlmap', 'nmap', 'masscan',
];

// Known bad IP prefix ranges (Tor exit nodes, known scanning infra)
export const KNOWN_BAD_IP_PREFIXES: string[] = [
  '185.220.', '45.142.', '23.129.', '51.83.', '176.10.',
  '194.165.', '80.67.', '199.195.', '162.247.', '104.244.',
];

// Request rate threshold above which we classify as bot
const HIGH_RATE_THRESHOLD = 100; // requests per minute

export function applyHeuristics(features: TrafficFeatures): 'human' | 'bot' | 'uncertain' {
  // 1. IP blocklist check
  for (const prefix of KNOWN_BAD_IP_PREFIXES) {
    if (features.ipAddress.startsWith(prefix)) {
      return 'bot';
    }
  }

  // 2. Rate limit check
  if (features.requestRatePerMin > HIGH_RATE_THRESHOLD) {
    return 'bot';
  }

  // 3. Empty User-Agent
  if (!features.userAgent || features.userAgent.trim() === '') {
    return 'bot';
  }

  // 4. Known bad User-Agent signatures (case-insensitive)
  const uaLower = features.userAgent.toLowerCase();
  for (const sig of KNOWN_BAD_USER_AGENTS) {
    if (uaLower.includes(sig.toLowerCase())) {
      return 'bot';
    }
  }

  // 5. Missing Sec-Fetch headers + very low UA entropy = likely automated
  if (!features.hasSecFetchHeaders && features.uaEntropy < 2.5) {
    return 'bot';
  }

  // 6. Missing Accept-Language + missing Sec-Fetch = strong bot signal
  if (!features.acceptLangPresent && !features.hasSecFetchHeaders) {
    return 'bot';
  }

  // 7. Low header count (bots often send minimal headers)
  if (features.headerCount < 3) {
    return 'bot';
  }

  // 8. Self-declared bot in UA
  if (uaLower.includes('bot') || uaLower.includes('crawler') || uaLower.includes('spider')) {
    return 'bot';
  }

  // Default: insufficient evidence, fall through to ML
  return 'uncertain';
}

export function getHeuristicDetails(features: TrafficFeatures): { triggered: string[]; result: string } {
  const triggered: string[] = [];

  for (const prefix of KNOWN_BAD_IP_PREFIXES) {
    if (features.ipAddress.startsWith(prefix)) {
      triggered.push(`IP_BLOCKLIST: ${features.ipAddress}`);
    }
  }
  if (features.requestRatePerMin > HIGH_RATE_THRESHOLD) {
    triggered.push(`HIGH_RATE: ${features.requestRatePerMin}/min`);
  }
  if (!features.userAgent) triggered.push('EMPTY_UA');
  if (!features.hasSecFetchHeaders) triggered.push('MISSING_SEC_FETCH');
  if (!features.acceptLangPresent) triggered.push('MISSING_ACCEPT_LANG');
  if (features.headerCount < 3) triggered.push(`LOW_HEADER_COUNT: ${features.headerCount}`);

  return {
    triggered,
    result: triggered.length > 0 ? 'bot' : 'uncertain',
  };
}

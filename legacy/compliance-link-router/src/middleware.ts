/**
 * @file middleware.ts
 * @description Aegis Route — Enterprise Edge Middleware (Next.js 14+)
 *
 *              Execution pipeline per request:
 *
 *                ┌─────────────────────────────────────────────────────────┐
 *                │ 1. Static asset / API bypass (immediate passthrough)     │
 *                │ 2. IP extraction & leaky-bucket rate limiting via Redis  │
 *                │    Lua script (atomic, single round-trip)               │
 *                │ 3. ML Traffic Classification                             │
 *                │      a. Feature extraction                              │
 *                │      b. Heuristic fast-path (known bad UA / IP)         │
 *                │      c. MLP forward pass (10->32->1)                    │
 *                │      d. Secondary heuristics (uncertain zone)           │
 *                │ 4. Geo-based routing (request.geo.country)              │
 *                │ 5. Device detection (UA mobile/tablet/desktop)          │
 *                │ 6. Link config lookup from Redis KV (link:{slug})       │
 *                │ 7. Rule evaluation (ml_score, geo, device, time)        │
 *                │ 8. Response: redirect / rewrite / 404 / 429             │
 *                └─────────────────────────────────────────────────────────┘
 *
 *              Error contract:
 *                Every major step is wrapped in try/catch.  A failure in
 *                classification, Redis, or rule evaluation NEVER crashes the
 *                middleware — the request falls through to NextResponse.next().
 *
 *              Latency target: < 30 ms end-to-end on Vercel Edge Network.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { classifyTraffic } from './lib/ml/classifier';
import type { ClassificationResult } from './lib/ml/types';



// ===========================================================================
// Constants
// ===========================================================================

/**
 * Leaky-bucket capacity (maximum tokens per bucket).
 * A full bucket allows BUCKET_CAPACITY requests before any are dropped.
 */
const BUCKET_CAPACITY = 100;

/**
 * Leak rate: tokens refilled per second.
 * At LEAK_RATE_PER_SECOND = 10, a completely empty bucket is fully refilled
 * in 10 seconds (100 / 10 = 10 s).
 */
const LEAK_RATE_PER_SECOND = 10;

/**
 * Redis key prefix for leaky-bucket state hashes.
 * Final key: `rl:{ip}` e.g. `rl:1.2.3.4`
 */
const RATE_LIMIT_KEY_PREFIX = 'rl:';

/**
 * Redis key prefix for link configuration hashes.
 * Final key: `link:{slug}` e.g. `link:my-campaign`
 */
const LINK_CONFIG_KEY_PREFIX = 'link:';

/**
 * Upstash Lua script for atomic leaky-bucket rate limiting.
 *
 * KEYS[1]  — bucket key (e.g., "rl:1.2.3.4")
 * ARGV[1]  — bucket capacity (integer)
 * ARGV[2]  — leak rate per second (float)
 * ARGV[3]  — current Unix timestamp in milliseconds (integer)
 *
 * Returns:
 *   1  — request allowed
 *   0  — rate limited (bucket empty)
 */
const LEAKY_BUCKET_LUA = `
local key        = KEYS[1]
local capacity   = tonumber(ARGV[1])
local leak_rate  = tonumber(ARGV[2])
local now        = tonumber(ARGV[3])

local bucket     = redis.call("HMGET", key, "tokens", "last_update")
local tokens     = tonumber(bucket[1])
local last_ts    = tonumber(bucket[2])

if not tokens then
  tokens   = capacity
  last_ts  = now
end

local elapsed  = (now - last_ts) / 1000
local leaked   = elapsed * leak_rate
tokens = math.min(capacity, tokens + leaked)

if tokens >= 1 then
  tokens = tokens - 1
  redis.call("HMSET", key, "tokens", tokens, "last_update", now)
  redis.call("EXPIRE", key, math.ceil(capacity / leak_rate) + 10)
  return 1
else
  redis.call("HMSET", key, "tokens", tokens, "last_update", now)
  return 0
end
`;

// ===========================================================================
// Types
// ===========================================================================

/**
 * A single conditional redirect rule stored in the link configuration.
 */
interface RedirectRule {
  /** Rule category. One of: 'ml_score' | 'geo' | 'device' | 'time' */
  rule_type: string;
  /**
   * Rule value:
   *   ml_score — minimum bot score threshold (e.g., '0.7')
   *   geo      — ISO 3166-1 alpha-2 country code (e.g., 'US')
   *   device   — 'mobile' | 'tablet' | 'desktop'
   *   time     — 'HH-HH' hour range in UTC (e.g., '00-06')
   */
  rule_value: string;
  /** Destination URL when this rule matches */
  target_url: string;
  /** Optional rule priority (lower = higher priority). Default 100. */
  priority?: number;
}

/**
 * Link configuration object retrieved from Redis.
 * Mirrors the shape stored by the link management API.
 */
interface LinkConfig {
  /** The slug identifier for this link */
  slug: string;
  /** Default destination URL when no rules match */
  default_target_url: string;
  /** Ordered list of conditional redirect rules */
  redirect_rules: RedirectRule[];
  /** Whether this link is currently active */
  is_active: boolean;
  /** Optional custom 404 redirect URL */
  not_found_url?: string;
}

/** Detected device category from the User-Agent string */
type DeviceType = 'mobile' | 'tablet' | 'desktop';

// ===========================================================================
// Redis Client (lazy singleton)
// ===========================================================================

let _redis: Redis | null = null;

/**
 * Returns the Upstash Redis client, initialised lazily on first call.
 * Throws if environment variables are not configured.
 */
function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      '[Aegis/Middleware] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set.'
    );
  }

  _redis = new Redis({ url, token });
  return _redis;
}

// ===========================================================================
// Helper: Device Detection
// ===========================================================================

/**
 * Detects the device type from the User-Agent string.
 *
 * Detection order (first match wins):
 *   1. Tablet  — 'ipad' | 'tablet' | 'kindle' | 'playbook'
 *   2. Mobile  — 'mobile' | 'android' | 'iphone' | 'ipod' | 'blackberry' |
 *                'windows phone' | 'opera mini' | 'iemobile'
 *   3. Desktop — fallback
 *
 * @param userAgent - Raw User-Agent header value.
 * @returns DeviceType
 */
function detectDevice(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();

  // Tablet detection (must come before mobile — iPad UA contains 'mobile' on iOS 13+)
  if (
    ua.includes('ipad') ||
    ua.includes('tablet') ||
    ua.includes('kindle') ||
    ua.includes('playbook') ||
    (ua.includes('android') && !ua.includes('mobile'))
  ) {
    return 'tablet';
  }

  // Mobile detection
  if (
    ua.includes('mobile') ||
    ua.includes('iphone') ||
    ua.includes('ipod') ||
    ua.includes('blackberry') ||
    ua.includes('windows phone') ||
    ua.includes('opera mini') ||
    ua.includes('iemobile')
  ) {
    return 'mobile';
  }

  return 'desktop';
}

// ===========================================================================
// Helper: Leaky-Bucket Rate Limiting
// ===========================================================================

/**
 * Executes the leaky-bucket rate limiting Lua script atomically in Redis.
 *
 * @param ip  - Client IP address (Redis key component).
 * @param now - Current Unix timestamp in milliseconds.
 * @returns   - true if the request is allowed; false if rate-limited.
 *             Returns true on Redis errors (fail-open to avoid blocking legit traffic).
 */
async function checkRateLimit(ip: string, now: number): Promise<boolean> {
  try {
    const redis = getRedis();
    const key = `${RATE_LIMIT_KEY_PREFIX}${ip}`;
    const result = await redis.eval(
      LEAKY_BUCKET_LUA,
      [key],
      [BUCKET_CAPACITY, LEAK_RATE_PER_SECOND, now]
    );
    return result === 1;
  } catch (err) {
    // Fail-open: Redis unavailability should not block legitimate traffic
    console.error('[Aegis/Middleware] Rate limit Redis error (failing open):', err);
    return true;
  }
}

// ===========================================================================
// Helper: Link Config Lookup
// ===========================================================================

/**
 * Fetches the link configuration for a given slug from Upstash Redis.
 *
 * The key format is `link:{slug}`, matching what the link-management API stores.
 * Returns null on cache miss, parse error, or Redis failure.
 *
 * @param slug - URL path slug (e.g., 'my-campaign').
 * @returns    - LinkConfig or null.
 */
async function getLinkConfig(slug: string): Promise<LinkConfig | null> {
  try {
    const redis = getRedis();
    const key = `${LINK_CONFIG_KEY_PREFIX}${slug}`;

    // Upstash Redis returns pre-parsed JSON objects when the stored value is
    // valid JSON; check for both object and string cases.
    const raw = await redis.get<LinkConfig | string>(key);

    if (!raw) return null;

    if (typeof raw === 'object') return raw as LinkConfig;

    // String case — parse manually
    return JSON.parse(raw as string) as LinkConfig;
  } catch (err) {
    console.error('[Aegis/Middleware] Failed to fetch link config from Redis:', err);
    return null;
  }
}

// ===========================================================================
// Helper: Rule Evaluation
// ===========================================================================

/**
 * Evaluates the ordered list of redirect rules against the current request
 * context and returns the first matching target URL, or null if no rule matches.
 *
 * Rule evaluation order:
 *   1. Rules are sorted by `priority` (ascending, lower = higher priority).
 *      Rules without an explicit priority are treated as priority 100.
 *   2. The first rule whose conditions are satisfied is applied.
 *   3. If no rule matches, null is returned and the caller uses default_target_url.
 *
 * @param rules      - Array of RedirectRule from the link config.
 * @param mlResult   - Full ML ClassificationResult.
 * @param countryCode- ISO 3166-1 alpha-2 country code from request.geo.
 * @param device     - Detected device type.
 * @param userAgent  - Raw User-Agent header value.
 * @returns          - Matching target URL or null.
 */
function evaluateRules(
  rules: RedirectRule[],
  mlResult: ClassificationResult,
  countryCode: string,
  device: DeviceType,
  userAgent: string
): string | null {
  // Sort by priority (ascending)
  const sorted = [...rules].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100)
  );

  const nowHour = new Date().getUTCHours();

  for (const rule of sorted) {
    let matches = false;

    switch (rule.rule_type) {
      // ---- ML Score Rule ------------------------------------------------
      // Applies when the traffic is classified as 'bot' AND the ml score
      // exceeds the rule's numeric threshold.
      case 'ml_score': {
        const threshold = parseFloat(rule.rule_value);
        if (
          !isNaN(threshold) &&
          mlResult.label === 'bot' &&
          mlResult.score >= threshold
        ) {
          matches = true;
        }
        break;
      }

      // ---- Geo Rule ------------------------------------------------------
      // Applies when the request's country code matches the rule value.
      case 'geo': {
        if (
          rule.rule_value &&
          countryCode.toUpperCase() === rule.rule_value.toUpperCase()
        ) {
          matches = true;
        }
        break;
      }

      // ---- Device Rule ---------------------------------------------------
      // Applies when the detected device type matches the rule value.
      case 'device': {
        if (device === rule.rule_value.toLowerCase()) {
          matches = true;
        }
        break;
      }

      // ---- Time Rule -----------------------------------------------------
      // rule_value format: "HH-HH" (UTC hours, inclusive range).
      // Example: '00-06' matches midnight to 6 AM UTC.
      case 'time': {
        const parts = rule.rule_value.split('-');
        if (parts.length === 2) {
          const startHour = parseInt(parts[0], 10);
          const endHour = parseInt(parts[1], 10);
          if (!isNaN(startHour) && !isNaN(endHour)) {
            if (startHour <= endHour) {
              // Normal range: e.g., 08-22
              matches = nowHour >= startHour && nowHour <= endHour;
            } else {
              // Overnight range: e.g., 22-06 (wraps midnight)
              matches = nowHour >= startHour || nowHour <= endHour;
            }
          }
        }
        break;
      }

      // ---- User-Agent Rule -----------------------------------------------
      // Applies when the UA contains the rule value substring (case-insensitive).
      case 'user_agent': {
        if (
          rule.rule_value &&
          userAgent.toLowerCase().includes(rule.rule_value.toLowerCase())
        ) {
          matches = true;
        }
        break;
      }

      default:
        // Unknown rule type — skip
        break;
    }

    if (matches && rule.target_url) {
      return rule.target_url;
    }
  }

  return null; // No rule matched
}

// ===========================================================================
// Middleware Matcher Config
// ===========================================================================

/**
 * Next.js middleware matcher.
 * Excludes:
 *   - _next/static     — compiled JS/CSS bundles
 *   - _next/image      — image optimisation API
 *   - favicon.ico      — browser favicon
 *   - /api/*           — API routes (handled separately)
 *   - /_*              — internal Next.js routes
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|api/).*)',
  ],
};

// ===========================================================================
// Main Middleware Function
// ===========================================================================

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const startMs = Date.now();

  // -------------------------------------------------------------------------
  // Step 0: Bypass for internal / non-slug routes
  // -------------------------------------------------------------------------
  // Paths that don't represent link slugs:
  if (
    url.pathname === '/' ||
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract the first path segment as the link slug
  const segments = url.pathname.split('/').filter(Boolean);
  const slug = segments[0];
  if (!slug) return NextResponse.next();

  // Bypass for reserved application routes
  const RESERVED_PATHS = [
    'login',
    'signup',
    'dashboard',
    'analytics',
    'audit-logs',
    'links',
    'ml-engine',
    'security',
    'settings',
    'rules',
    'docs'
  ];
  if (RESERVED_PATHS.includes(slug.toLowerCase())) {
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // Step 1: IP Extraction
  // -------------------------------------------------------------------------
  const ip: string =
    request.ip ||
    (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
    '127.0.0.1';

  const now = Date.now();

  // -------------------------------------------------------------------------
  // Step 2: Leaky-Bucket Rate Limiting (FR-09)
  //
  //   The Lua script runs atomically in Redis — no TOCTOU race conditions.
  //   On Redis unavailability we fail open (return true from checkRateLimit).
  // -------------------------------------------------------------------------
  const isAllowed = await checkRateLimit(ip, now);

  if (!isAllowed) {
    const retryAfterSeconds = Math.ceil(BUCKET_CAPACITY / LEAK_RATE_PER_SECOND);
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Compliance-enforced rate limit exceeded. Please slow down.',
        retryAfter: retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(BUCKET_CAPACITY),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(now / 1000) + retryAfterSeconds),
          'X-Aegis-Blocked': 'rate-limit',
        },
      }
    );
  }

  // -------------------------------------------------------------------------
  // Step 3: ML Traffic Classification (FR-11)
  //
  //   Full pipeline: feature extraction -> heuristic fast-path -> MLP ->
  //   secondary heuristics -> ClassificationResult.
  //   Never throws — returns safe default on any internal error.
  // -------------------------------------------------------------------------
  let mlResult: ClassificationResult = {
    score: 0.5,
    label: 'uncertain',
    confidence: 0,
    features: {
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') ?? '',
      requestRatePerMin: 0,
      headerCount: 0,
      hasSecFetchHeaders: false,
      acceptLangPresent: false,
      uaEntropy: 0,
      headerOrderScore: 0,
      connectionTimeMs: 0,
      refererPresent: false,
    },
    heuristicOverride: false,
  };

  try {
    mlResult = await classifyTraffic(request);
  } catch (mlErr) {
    // classifyTraffic is documented as never-throwing, but we defend anyway
    console.error('[Aegis/Middleware] classifyTraffic threw unexpectedly:', mlErr);
  }

  // Hard-reject confirmed bots with very high confidence (score >= 0.9)
  // Redirect to a honeypot/bot-trap page if configured, or return 403.
  if (mlResult.label === 'bot' && mlResult.confidence >= 0.9) {
    const botTrapUrl = process.env.AEGIS_BOT_TRAP_URL;
    if (botTrapUrl) {
      return NextResponse.redirect(new URL(botTrapUrl), {
        status: 302,
        headers: {
          'X-Aegis-Blocked': 'ml-bot-trap',
          'X-ML-Score': mlResult.score.toFixed(4),
        },
      });
    }
    // No bot trap configured — silently serve a 403
    return new NextResponse(
      JSON.stringify({ error: 'Forbidden', message: 'Automated traffic detected.' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Aegis-Blocked': 'ml-high-confidence-bot',
        },
      }
    );
  }

  // -------------------------------------------------------------------------
  // Step 4: Geo-Based Context
  // -------------------------------------------------------------------------
  const countryCode: string = request.geo?.country ?? 'UNKNOWN';
  const region: string = request.geo?.region ?? '';
  const city: string = request.geo?.city ?? '';

  // -------------------------------------------------------------------------
  // Step 5: Device Detection
  // -------------------------------------------------------------------------
  const userAgent: string = request.headers.get('user-agent') ?? '';
  const device: DeviceType = detectDevice(userAgent);

  // -------------------------------------------------------------------------
  // Step 6: Link Config Lookup from Redis KV
  //
  //   Key: link:{slug}
  //   Value: JSON-serialised LinkConfig stored by the link-management API.
  // -------------------------------------------------------------------------
  let linkConfig: LinkConfig | null = null;

  try {
    linkConfig = await getLinkConfig(slug);
  } catch (kvErr) {
    console.error('[Aegis/Middleware] Link config lookup error:', kvErr);
  }

  // 404 when no link config is found for the slug
  if (!linkConfig) {
    return NextResponse.rewrite(new URL('/404', request.url), {
      headers: {
        'X-Aegis-Miss': slug,
      },
    });
  }

  // Inactive links serve 404
  if (!linkConfig.is_active) {
    const notFoundDest = linkConfig.not_found_url ?? '/404';
    return NextResponse.rewrite(new URL(notFoundDest, request.url));
  }

  // -------------------------------------------------------------------------
  // Step 7: Rule Evaluation
  // -------------------------------------------------------------------------
  let targetUrl = linkConfig.default_target_url;
  let matchedRuleType: string | null = null;

  try {
    const matchedUrl = evaluateRules(
      linkConfig.redirect_rules ?? [],
      mlResult,
      countryCode,
      device,
      userAgent
    );
    if (matchedUrl) {
      targetUrl = matchedUrl;
      // Identify which rule type matched (first matching rule's type)
      // We re-evaluate only to find the type — the URL is already determined.
      // For efficiency, we just scan for the first matching rule_type.
      const sortedRules = [...(linkConfig.redirect_rules ?? [])].sort(
        (a, b) => (a.priority ?? 100) - (b.priority ?? 100)
      );
      for (const rule of sortedRules) {
        if (rule.target_url === matchedUrl) {
          matchedRuleType = rule.rule_type;
          break;
        }
      }
    }
  } catch (ruleErr) {
    console.error('[Aegis/Middleware] Rule evaluation error (using default URL):', ruleErr);
  }

  // -------------------------------------------------------------------------
  // Step 8: Response Construction
  //
  //   Build response headers with audit trail info for logging/monitoring.
  // -------------------------------------------------------------------------
  const latencyMs = Date.now() - startMs;

  const responseHeaders: Record<string, string> = {
    'X-Aegis-Routed': 'true',
    'X-Edge-Routing': 'true',
    'X-Traffic-Label': mlResult.label,
    'X-ML-Score': mlResult.score.toFixed(4),
    'X-ML-Confidence': mlResult.confidence.toFixed(4),
    'X-ML-Heuristic-Override': mlResult.heuristicOverride ? '1' : '0',
    'X-Geo-Country': countryCode,
    'X-Geo-Region': region,
    'X-Geo-City': city,
    'X-Device-Type': device,
    'X-Edge-Latency-Ms': String(latencyMs),
  };

  if (matchedRuleType) {
    responseHeaders['X-Matched-Rule'] = matchedRuleType;
  }

  // Validate the target URL — if it's malformed, use the default
  let finalUrl: URL;
  try {
    finalUrl = new URL(targetUrl);
  } catch (_) {
    console.error(
      `[Aegis/Middleware] Malformed target URL '${targetUrl}'. ` +
      `Using default: '${linkConfig.default_target_url}'`
    );
    try {
      finalUrl = new URL(linkConfig.default_target_url);
    } catch (_2) {
      // Both URLs are malformed — rewrite to homepage
      return NextResponse.rewrite(new URL('/', request.url));
    }
  }

  // Perform the redirect
  const redirectResponse = NextResponse.redirect(finalUrl, { status: 302 });
  Object.entries(responseHeaders).forEach(([k, v]) => {
    redirectResponse.headers.set(k, v);
  });

  return redirectResponse;
}

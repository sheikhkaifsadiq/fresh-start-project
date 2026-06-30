/**
 * @file src/lib/routing/core-router.ts
 * @description Framework-agnostic routing core layer for AegisRoute.
 * This module contains pure functions and type definitions for:
 * - Feature extraction
 * - Rule evaluation engine
 * - Device detection
 * - Final routing decision output schema
 * 
 * NO framework imports (e.g. Next.js, TanStack Start, React) are permitted here.
 */

// ===========================================================================
// Type Definitions & Schemas
// ===========================================================================

/** Detected device category from the User-Agent string */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * A single conditional redirect rule stored in the link configuration.
 */
export interface RedirectRule {
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
 * Link configuration object retrieved from the KV store.
 */
export interface LinkConfig {
  slug: string;
  default_target_url: string;
  redirect_rules: RedirectRule[];
  is_active: boolean;
  not_found_url?: string;
}

/**
 * ML Scoring Interface Boundary.
 * Defines the result of the traffic classification phase.
 */
export interface ClassificationResult {
  score: number;
  label: 'bot' | 'human' | 'uncertain';
  confidence: number;
  features: Record<string, any>;
  heuristicOverride: boolean;
}

/**
 * The final routing decision output schema.
 * Represents what the edge adapter should do with the request.
 */
export type RoutingDecision =
  | { action: 'PASSTHROUGH' }
  | { action: 'BLOCK_RATE_LIMIT'; retryAfterSeconds: number }
  | { action: 'BLOCK_BOT_TRAP'; targetUrl: string; score: number }
  | { action: 'BLOCK_FORBIDDEN'; reason: string }
  | { action: 'NOT_FOUND'; slug: string; fallbackUrl?: string }
  | { action: 'REDIRECT'; targetUrl: string; matchedRuleType?: string; headers: Record<string, string> }
  | { action: 'REWRITE'; targetUrl: string; headers: Record<string, string> };

/**
 * Agnostic representation of an incoming HTTP request for the routing engine.
 */
export interface CoreRoutingRequest {
  path: string;
  ip: string;
  userAgent: string;
  countryCode: string;
  region: string;
  city: string;
  now: number;
  /** Any custom logic to check rate limits via atomic KV operations */
  checkRateLimit: (ip: string, now: number) => Promise<boolean>;
  /** Any custom logic to classify traffic via ML/Heuristics */
  classifyTraffic: () => Promise<ClassificationResult>;
  /** Any custom logic to lookup the link configuration */
  getLinkConfig: (slug: string) => Promise<LinkConfig | null>;
}

// ===========================================================================
// Core Functions (Pure Logic)
// ===========================================================================

/**
 * Detects the device type from the User-Agent string.
 */
export function detectDevice(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();

  if (
    ua.includes('ipad') ||
    ua.includes('tablet') ||
    ua.includes('kindle') ||
    ua.includes('playbook') ||
    (ua.includes('android') && !ua.includes('mobile'))
  ) {
    return 'tablet';
  }

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

/**
 * Evaluates the ordered list of redirect rules against the current request
 * context and returns the first matching target URL, or null if no rule matches.
 */
export function evaluateRules(
  rules: RedirectRule[],
  mlResult: ClassificationResult,
  countryCode: string,
  device: DeviceType,
  userAgent: string,
  nowHourUtc: number
): string | null {
  const sorted = [...rules].sort(
    (a, b) => (a.priority ?? 100) - (b.priority ?? 100)
  );

  for (const rule of sorted) {
    let matches = false;

    switch (rule.rule_type) {
      case 'ml_score': {
        const threshold = parseFloat(rule.rule_value);
        if (!isNaN(threshold) && mlResult.label === 'bot' && mlResult.score >= threshold) {
          matches = true;
        }
        break;
      }
      case 'geo': {
        if (rule.rule_value && countryCode.toUpperCase() === rule.rule_value.toUpperCase()) {
          matches = true;
        }
        break;
      }
      case 'device': {
        if (device === rule.rule_value.toLowerCase()) {
          matches = true;
        }
        break;
      }
      case 'time': {
        const parts = rule.rule_value.split('-');
        if (parts.length === 2) {
          const startHour = parseInt(parts[0], 10);
          const endHour = parseInt(parts[1], 10);
          if (!isNaN(startHour) && !isNaN(endHour)) {
            if (startHour <= endHour) {
              matches = nowHourUtc >= startHour && nowHourUtc <= endHour;
            } else {
              matches = nowHourUtc >= startHour || nowHourUtc <= endHour;
            }
          }
        }
        break;
      }
      case 'user_agent': {
        if (rule.rule_value && userAgent.toLowerCase().includes(rule.rule_value.toLowerCase())) {
          matches = true;
        }
        break;
      }
    }

    if (matches && rule.target_url) {
      return rule.target_url;
    }
  }

  return null;
}

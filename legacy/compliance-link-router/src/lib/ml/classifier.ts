/**
 * @file classifier.ts
 * @description Orchestrator for the Aegis Route ML Traffic Classification pipeline.
 *
 *              Execution order:
 *                1. Feature extraction (feature-extractor.ts)
 *                2. Heuristic fast-path for known-bad patterns (heuristics.ts)
 *                3. Neural-network forward pass (neural-network.ts)
 *                4. Secondary heuristic check when MLP is in uncertain zone [0.4, 0.6]
 *                5. Confidence computation and ClassificationResult assembly
 *
 *              Error contract:
 *                Any uncaught exception anywhere in the pipeline returns a
 *                safe default: { score: 0.5, label: 'uncertain', confidence: 0,
 *                heuristicOverride: false }.  The middleware MUST handle
 *                'uncertain' gracefully.
 *
 *              Latency target: < 5 ms total (excluding Redis I/O) on V8.
 */

import { NextRequest } from 'next/server';
import { extractFeatures } from './feature-extractor';
import { applyHeuristics, getHeuristicDetails } from './heuristics';
import { forwardPass, featuresToVector, DEFAULT_WEIGHTS } from './neural-network';
import type { ClassificationResult, TrafficFeatures, MLModelWeights } from './types';

// ===========================================================================
// Constants
// ===========================================================================

/** Score above which the MLP confidently labels traffic as 'bot'. */
const BOT_THRESHOLD = 0.6;

/** Score below which the MLP confidently labels traffic as 'human'. */
const HUMAN_THRESHOLD = 0.4;

/**
 * Safe default result returned on any unhandled error in the pipeline.
 * 'uncertain' with confidence 0 is the safest non-blocking fallback —
 * middleware can choose to allow the request and log the failure.
 */
const SAFE_DEFAULT_RESULT: ClassificationResult = {
  score: 0.5,
  label: 'uncertain',
  confidence: 0,
  features: {
    ipAddress: '0.0.0.0',
    userAgent: '',
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

// ===========================================================================
// Utility
// ===========================================================================

/**
 * Converts a raw ML score in [0, 1] to a normalised confidence value.
 *
 * Confidence = distance from the 0.5 decision boundary, scaled to [0, 1]:
 *   confidence = |score - 0.5| * 2
 *
 *   score = 0.5  ->  confidence = 0  (maximum uncertainty)
 *   score = 0.0  ->  confidence = 1  (maximum certainty, human)
 *   score = 1.0  ->  confidence = 1  (maximum certainty, bot)
 *
 * @param score - ML output score in [0, 1].
 * @returns     - Confidence in [0, 1].
 */
function computeConfidence(score: number): number {
  return Math.min(1, Math.abs(score - 0.5) * 2);
}

/**
 * Derives the discrete label from a score and an optional heuristic override.
 *
 * @param score            - MLP output score in [0, 1].
 * @param heuristicResult  - Result from the heuristic tree (if run).
 * @param heuristicApplied - Whether the heuristic tree produced a definitive answer.
 * @returns                - 'human' | 'bot' | 'uncertain'
 */
function deriveLabel(
  score: number,
  heuristicResult: 'human' | 'bot' | 'uncertain',
  heuristicApplied: boolean
): 'human' | 'bot' | 'uncertain' {
  if (heuristicApplied && heuristicResult === 'bot') return 'bot';
  if (score > BOT_THRESHOLD) return 'bot';
  if (score < HUMAN_THRESHOLD) return 'human';

  // Score is in uncertain zone [0.4, 0.6]: use secondary heuristic result
  if (heuristicApplied) return heuristicResult;

  return 'uncertain';
}

// ===========================================================================
// Primary Export: classifyTraffic
// ===========================================================================

/**
 * Full ML Traffic Classification pipeline for Aegis Route.
 *
 * @param request - The incoming Edge NextRequest.
 * @param weights - Optional custom MLModelWeights to override DEFAULT_WEIGHTS.
 *                  Useful when a synced model from Redis/Supabase is available.
 * @returns       - A fully populated ClassificationResult, never throws.
 *
 * @example
 * // In middleware.ts:
 * const result = await classifyTraffic(request);
 * if (result.label === 'bot') {
 *   return NextResponse.redirect(new URL('/bot-trap', request.url));
 * }
 */
export async function classifyTraffic(
  request: NextRequest,
  weights?: MLModelWeights
): Promise<ClassificationResult> {
  try {
    // ------------------------------------------------------------------
    // Step 1: Feature Extraction
    // ------------------------------------------------------------------
    let features: TrafficFeatures;
    try {
      features = extractFeatures(request);
    } catch (extractErr) {
      console.error('[Aegis/Classifier] Feature extraction failed:', extractErr);
      return { ...SAFE_DEFAULT_RESULT };
    }

    // ------------------------------------------------------------------
    // Step 2: Heuristic fast-path for known-bad patterns
    //
    //   The heuristics run FIRST for deterministic, low-latency rejection
    //   of obviously malicious traffic (known UAs, bad IPs, empty UA).
    //   If a definitive 'bot' result is returned, we skip the MLP entirely.
    // ------------------------------------------------------------------
    let heuristicOverride = false;
    let heuristicLabel: 'human' | 'bot' | 'uncertain' = 'uncertain';

    try {
      const fastHeuristicResult = applyHeuristics(features);
      if (fastHeuristicResult === 'bot') {
        // Immediate bot determination — skip neural network
        heuristicOverride = true;
        heuristicLabel = 'bot';
        return {
          score: 1.0,
          label: 'bot',
          confidence: 1.0,
          features,
          heuristicOverride: true,
        };
      }
    } catch (heuristicErr) {
      // Heuristic failure is non-fatal; proceed to MLP
      console.error('[Aegis/Classifier] Heuristic fast-path failed:', heuristicErr);
    }

    // ------------------------------------------------------------------
    // Step 3: Neural-Network Forward Pass
    // ------------------------------------------------------------------
    let mlScore = 0.5;
    const activeWeights = weights ?? DEFAULT_WEIGHTS;

    try {
      const featureVector = featuresToVector(features);
      mlScore = forwardPass(featureVector, activeWeights);
      // Guard against NaN / Infinity from weight corruption
      if (!isFinite(mlScore) || isNaN(mlScore)) {
        console.error('[Aegis/Classifier] MLP produced non-finite output, defaulting to 0.5');
        mlScore = 0.5;
      }
    } catch (mlErr) {
      // MLP failure is non-fatal; fall through to secondary heuristics
      console.error('[Aegis/Classifier] MLP forward pass failed:', mlErr);
      mlScore = 0.5;
    }

    // ------------------------------------------------------------------
    // Step 4: Secondary heuristic check when MLP is uncertain
    //
    //   The uncertain zone [0.4, 0.6] means the network is not confident.
    //   In this band we run the full heuristic tree for a tie-breaker.
    //   Outside the band, the MLP score is authoritative.
    // ------------------------------------------------------------------
    let secondaryHeuristicApplied = false;

    if (mlScore >= HUMAN_THRESHOLD && mlScore <= BOT_THRESHOLD) {
      try {
        const { result: secondaryResult } = getHeuristicDetails(features);
        heuristicLabel = secondaryResult as 'human' | 'bot' | 'uncertain';
        secondaryHeuristicApplied = true;

        // If the secondary heuristic says 'bot', escalate the score
        // to the lower bot-threshold so confidence is non-zero.
        if (secondaryResult === 'bot') {
          mlScore = BOT_THRESHOLD + 0.05; // 0.65 — confident bot
          heuristicOverride = true;
        }
      } catch (secErr) {
        console.error('[Aegis/Classifier] Secondary heuristic check failed:', secErr);
      }
    }

    // ------------------------------------------------------------------
    // Step 5: Build Classification Result
    // ------------------------------------------------------------------
    const label = deriveLabel(mlScore, heuristicLabel, secondaryHeuristicApplied);
    const confidence = computeConfidence(mlScore);

    return {
      score: mlScore,
      label,
      confidence,
      features,
      heuristicOverride,
    };
  } catch (unexpectedErr) {
    // Top-level safety net: never crash the middleware.
    console.error('[Aegis/Classifier] Unexpected classification error:', unexpectedErr);
    return { ...SAFE_DEFAULT_RESULT };
  }
}

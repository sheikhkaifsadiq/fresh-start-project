/**
 * @file src/lib/security/rate-limit.ts
 * @description Client-side sliding-window rate limiter.
 * Wraps any async function and throws RateLimitError when the caller
 * exceeds the configured call budget within the rolling time window.
 *
 * This is intentionally a CLIENT-SIDE guard (e.g., for form submissions,
 * clipboard operations). Real API-level rate limiting is enforced server-side
 * via the Upstash Redis leaky-bucket in middleware.ts.
 */

// ---------------------------------------------------------------------------
// RateLimitError
// ---------------------------------------------------------------------------

/**
 * Thrown by `withRateLimit` when the caller exceeds the allowed call budget.
 */
export class RateLimitError extends Error {
  /** The number of milliseconds the caller must wait before retrying. */
  public readonly retryAfterMs: number;
  /** Maximum calls allowed within the window. */
  public readonly limit: number;
  /** Window duration in milliseconds. */
  public readonly windowMs: number;

  constructor(retryAfterMs: number, limit: number, windowMs: number) {
    super(
      `Rate limit exceeded. You may make at most ${limit} call(s) per ` +
        `${windowMs}ms window. Retry after ${retryAfterMs}ms.`
    );
    this.name = "RateLimitError";
    this.retryAfterMs = retryAfterMs;
    this.limit = limit;
    this.windowMs = windowMs;

    // Maintain proper prototype chain in transpiled environments
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ---------------------------------------------------------------------------
// Sliding window state (module-level, one entry per wrapped instance)
// ---------------------------------------------------------------------------

/**
 * Internal sliding-window call tracker.
 * Stores timestamps of recent invocations.
 */
interface RateLimiterState {
  timestamps: number[];
}

// ---------------------------------------------------------------------------
// Higher-order function
// ---------------------------------------------------------------------------

/**
 * Wraps an async function with client-side sliding-window rate limiting.
 *
 * The returned wrapper has the same signature as `fn`. On each invocation it:
 * 1. Drops timestamps older than `windowMs` from the sliding window.
 * 2. If the remaining count ≥ `maxCalls`, throws a `RateLimitError` with the
 *    exact milliseconds until the oldest call expires.
 * 3. Otherwise, records the current timestamp and delegates to `fn`.
 *
 * Each call to `withRateLimit` creates an independent rate-limiter instance —
 * the counters are not shared between different wrapped functions.
 *
 * @typeParam TArgs - Argument tuple of the wrapped function.
 * @typeParam TReturn - Return type of the wrapped function.
 *
 * @param fn - The async function to rate-limit.
 * @param maxCalls - Maximum number of invocations allowed within `windowMs`.
 *   Must be a positive integer.
 * @param windowMs - Duration of the sliding window in milliseconds.
 *   Must be a positive number.
 *
 * @returns A wrapped version of `fn` that enforces the rate limit.
 *
 * @throws {RateLimitError} When the call budget is exceeded.
 * @throws Whatever `fn` itself throws.
 *
 * @example
 * // Allow at most 3 login attempts every 60 seconds
 * const rateLimitedLogin = withRateLimit(
 *   async (email: string, password: string) => authStore.login(email, password),
 *   3,
 *   60_000
 * );
 *
 * try {
 *   await rateLimitedLogin('user@example.com', 'secret');
 * } catch (err) {
 *   if (err instanceof RateLimitError) {
 *     console.warn(`Too many attempts. Retry after ${err.retryAfterMs}ms`);
 *   }
 * }
 */
export function withRateLimit<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  maxCalls: number,
  windowMs: number
): (...args: TArgs) => Promise<TReturn> {
  if (!Number.isInteger(maxCalls) || maxCalls < 1) {
    throw new Error("`maxCalls` must be a positive integer.");
  }
  if (typeof windowMs !== "number" || windowMs <= 0) {
    throw new Error("`windowMs` must be a positive number.");
  }

  const state: RateLimiterState = { timestamps: [] };

  return async function rateLimitedFn(...args: TArgs): Promise<TReturn> {
    const now = Date.now();

    // 1. Evict timestamps outside the current window
    state.timestamps = state.timestamps.filter((t) => now - t < windowMs);

    // 2. Enforce budget
    if (state.timestamps.length >= maxCalls) {
      const oldest = state.timestamps[0];
      const retryAfterMs = windowMs - (now - oldest);
      throw new RateLimitError(Math.max(0, retryAfterMs), maxCalls, windowMs);
    }

    // 3. Record this call and delegate
    state.timestamps.push(now);
    return fn(...args);
  };
}

// ---------------------------------------------------------------------------
// Convenience factory: pre-configured common limiters
// ---------------------------------------------------------------------------

/**
 * Creates a rate-limited login function allowing at most `maxAttempts` login
 * calls within `windowSeconds` seconds.
 *
 * @param loginFn - The actual login async function.
 * @param maxAttempts - Defaults to 5.
 * @param windowSeconds - Defaults to 60.
 */
export function createLoginRateLimiter<TArgs extends unknown[], TReturn>(
  loginFn: (...args: TArgs) => Promise<TReturn>,
  maxAttempts = 5,
  windowSeconds = 60
): (...args: TArgs) => Promise<TReturn> {
  return withRateLimit(loginFn, maxAttempts, windowSeconds * 1000);
}

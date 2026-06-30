import { Redis } from "@upstash/redis";
import type { TelemetryEvent } from "./types";

const TELEMETRY_KEY = "telemetry:events";
const MAX_EVENTS = 500;
const TIMEOUT_MS = 50;

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

export function emitTelemetryEvent(event: Omit<TelemetryEvent, 'timestamp'>) {
  const redis = getRedis();
  if (!redis) return;

  const fullEvent = { ...event, timestamp: Date.now() };

  // Fire and forget, bounded by a 50ms timeout to ensure we don't leak unhandled promise
  // rejections that hang the isolate.
  const pushPromise = (async () => {
    try {
      const pipeline = redis.pipeline();
      pipeline.lpush(TELEMETRY_KEY, JSON.stringify(fullEvent));
      pipeline.ltrim(TELEMETRY_KEY, 0, MAX_EVENTS - 1);
      await pipeline.exec();
    } catch (e) {
      // Silently swallow errors to adhere to passive telemetry rules
      console.warn("[Telemetry] Failed to push event", e);
    }
  })();

  const timeoutPromise = new Promise((_, reject) => setTimeout(reject, TIMEOUT_MS));

  Promise.race([pushPromise, timeoutPromise]).catch(() => {
    // Ignore timeout rejection
  });
}

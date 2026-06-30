import { createFileRoute } from "@tanstack/react-router";
import { Redis } from "@upstash/redis";
import { createSecureHandler } from "@/lib/security/global-middleware.server";

export const Route = createFileRoute("/api/v1/telemetry/")({
  server: {
    handlers: {
      GET: createSecureHandler(
        async ({ request }) => {
          const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
          const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

          if (!upstashUrl || !upstashToken) {
            return Response.json({ error: "Telemetry Redis not configured" }, { status: 500 });
          }

          try {
            const url = new URL(request.url);
            const limitParam = url.searchParams.get("limit");
            const traceIdFilter = url.searchParams.get("traceId");
            const typeFilter = url.searchParams.get("type");
            const timeRangeFilter = url.searchParams.get("timeRange"); // e.g., '5m', '1h'

            let limit = 100;
            if (limitParam) {
              const parsedLimit = parseInt(limitParam, 10);
              if (!isNaN(parsedLimit) && parsedLimit > 0) limit = parsedLimit;
            }

            const redis = new Redis({ url: upstashUrl, token: upstashToken });
            // Always fetch max buffer size (500) since we are filtering in-memory
            const rawEvents = await redis.lrange("telemetry:events", 0, 499);
            
            // Upstash usually parses them if they are JSON, but we'll ensure they are objects.
            let events = rawEvents.map(e => (typeof e === "string" ? JSON.parse(e) : e));

            const now = Date.now();

            events = events.filter((e: any) => {
              if (traceIdFilter && !e.traceId.includes(traceIdFilter)) return false;
              if (typeFilter && typeFilter !== 'all' && e.type !== typeFilter) return false;
              
              if (timeRangeFilter && timeRangeFilter !== 'all') {
                let maxAgeMs = 0;
                if (timeRangeFilter === '5m') maxAgeMs = 5 * 60 * 1000;
                else if (timeRangeFilter === '15m') maxAgeMs = 15 * 60 * 1000;
                else if (timeRangeFilter === '1h') maxAgeMs = 60 * 60 * 1000;
                else if (timeRangeFilter === '24h') maxAgeMs = 24 * 60 * 60 * 1000;
                
                if (maxAgeMs > 0 && (now - e.timestamp > maxAgeMs)) return false;
              }
              
              return true;
            });

            // Apply limit after filtering
            events = events.slice(0, limit);

            return Response.json(events);
          } catch (error) {
            console.error("[TelemetryAPI] Failed to fetch events:", error);
            return Response.json({ error: "Failed to fetch telemetry events" }, { status: 500 });
          }
        },
        { minRole: 'admin' }
      ),
    },
  },
} as any);


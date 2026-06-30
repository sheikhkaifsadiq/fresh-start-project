import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { extractTraceContext, injectTraceContext } from "./lib/telemetry/tracer";
import { emitTelemetryEvent } from "./lib/telemetry/logger";
import { startTimer } from "./lib/telemetry/metrics";
// Pre-import the edge adapter at module load time so the Redis + ML module
// graph is transformed by Vite ONCE at server startup, not on every request.
import { processEdgeRoute } from "./lib/routing/adapter";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}


// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(rawRequest: Request, env: unknown, ctx: unknown) {
    const traceCtx = extractTraceContext(rawRequest);
    const request = injectTraceContext(rawRequest, traceCtx);
    const getDuration = startTimer();
    const url = new URL(request.url);

    try {
      // 1. Edge Router Integration
      // Intercept request for dynamic link routing before it hits TanStack Start
      const edgeResponse = await processEdgeRoute(request);
      if (edgeResponse) {
        emitTelemetryEvent({
          traceId: traceCtx.traceId,
          requestId: traceCtx.requestId,
          sessionId: traceCtx.sessionId,
          type: "RequestCompletion",
          path: url.pathname,
          statusCode: edgeResponse.status,
          totalDurationMs: getDuration()
        });
        return edgeResponse;
      }

      // 2. TanStack Start Application
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalizedResponse = await normalizeCatastrophicSsrResponse(response);

      emitTelemetryEvent({
        traceId: traceCtx.traceId,
        requestId: traceCtx.requestId,
        sessionId: traceCtx.sessionId,
        type: "RequestCompletion",
        path: url.pathname,
        statusCode: normalizedResponse.status,
        totalDurationMs: getDuration()
      });

      return normalizedResponse;
    } catch (error) {
      console.error(error);
      emitTelemetryEvent({
        traceId: traceCtx.traceId,
        requestId: traceCtx.requestId,
        sessionId: traceCtx.sessionId,
        type: "RequestCompletion",
        path: url.pathname,
        statusCode: 500,
        totalDurationMs: getDuration()
      });
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

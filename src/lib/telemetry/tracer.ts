export interface TraceContext {
  traceId: string;
  requestId: string;
  sessionId?: string;
}

export function extractTraceContext(request: Request): TraceContext {
  return {
    traceId: request.headers.get("x-trace-id") || crypto.randomUUID(),
    requestId: request.headers.get("x-request-id") || crypto.randomUUID(),
    sessionId: request.headers.get("x-session-id") || undefined,
  };
}

export function injectTraceContext(request: Request, context: TraceContext): Request {
  // Try to mutate headers directly if it's a mutable request, otherwise clone.
  const headers = new Headers(request.headers);
  headers.set("x-trace-id", context.traceId);
  headers.set("x-request-id", context.requestId);
  if (context.sessionId) {
    headers.set("x-session-id", context.sessionId);
  }

  // NextRequest or standard Request can sometimes be cloned this way
  return new Request(request.url, {
    method: request.method,
    headers,
    body: request.body,
    signal: request.signal,
    duplex: 'half'
  } as any);
}

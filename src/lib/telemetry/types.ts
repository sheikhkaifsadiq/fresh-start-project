export type TelemetryEventType = 
  | 'EdgeEntry'
  | 'MLClassification'
  | 'RoutingDecision'
  | 'APIResolution'
  | 'RequestCompletion'
  | 'FailOpen'
  | 'RateLimitBlock';

export interface BaseTelemetryEvent {
  traceId: string;
  requestId: string;
  sessionId?: string;
  timestamp: number;
  type: TelemetryEventType;
}

export interface EdgeEntryEvent extends BaseTelemetryEvent {
  type: 'EdgeEntry';
  path: string;
  ip: string;
  userAgent: string;
}

export interface MLClassificationEvent extends BaseTelemetryEvent {
  type: 'MLClassification';
  durationMs: number;
  label: string;
  score: number;
  confidence: number;
}

export interface RoutingDecisionEvent extends BaseTelemetryEvent {
  type: 'RoutingDecision';
  slug: string;
  matchedRuleType: string | null;
  targetUrl: string;
  configLookupDurationMs: number;
}

export interface APIResolutionEvent extends BaseTelemetryEvent {
  type: 'APIResolution';
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
}

export interface RequestCompletionEvent extends BaseTelemetryEvent {
  type: 'RequestCompletion';
  path: string;
  statusCode: number;
  totalDurationMs: number;
}

export interface FailOpenEvent extends BaseTelemetryEvent {
  type: 'FailOpen';
  subsystem: 'redis' | 'ml';
  error: string;
}

export interface RateLimitBlockEvent extends BaseTelemetryEvent {
  type: 'RateLimitBlock';
  ip: string;
}

export type TelemetryEvent = 
  | EdgeEntryEvent 
  | MLClassificationEvent 
  | RoutingDecisionEvent 
  | APIResolutionEvent 
  | RequestCompletionEvent 
  | FailOpenEvent
  | RateLimitBlockEvent;

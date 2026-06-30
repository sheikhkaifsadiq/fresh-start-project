import { useState, useMemo, useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldAlert, Cpu, Route as RouteIcon, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import type { TelemetryEvent, MLClassificationEvent, RoutingDecisionEvent, RequestCompletionEvent } from '@/lib/telemetry/types';

export const Route = createFileRoute('/_authenticated/telemetry')({
  component: TelemetryDashboard,
});

function TelemetryDashboard() {
  const [traceIdFilter, setTraceIdFilter] = useState('');
  const [debouncedTraceIdFilter, setDebouncedTraceIdFilter] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTraceIdFilter(traceIdFilter), 300);
    return () => clearTimeout(timer);
  }, [traceIdFilter]);

  const [typeFilter, setTypeFilter] = useState('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState('all');
  const [limitFilter, setLimitFilter] = useState('100');

  const { data: events = [], isLoading, isError } = useQuery<TelemetryEvent[]>({
    queryKey: ['telemetry-events', debouncedTraceIdFilter, typeFilter, timeRangeFilter, limitFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedTraceIdFilter) params.set('traceId', debouncedTraceIdFilter);
      if (typeFilter && typeFilter !== 'all') params.set('type', typeFilter);
      if (timeRangeFilter && timeRangeFilter !== 'all') params.set('timeRange', timeRangeFilter);
      if (limitFilter) params.set('limit', limitFilter);
      
      const res = await fetch(`/api/v1/telemetry?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch telemetry');
      return res.json();
    },
    refetchInterval: 3000,
  });

  // Group events into traces
  const traces = useMemo(() => {
    const map = new Map<string, TelemetryEvent[]>();
    for (const e of events) {
      if (!map.has(e.traceId)) map.set(e.traceId, []);
      map.get(e.traceId)!.push(e);
    }
    const grouped = Array.from(map.entries()).map(([traceId, traceEvents]) => {
      traceEvents.sort((a, b) => a.timestamp - b.timestamp);
      return { traceId, events: traceEvents, start: traceEvents[0]?.timestamp || 0 };
    });
    grouped.sort((a, b) => b.start - a.start);
    return grouped;
  }, [events]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const mlEvents = events.filter((e) => e.type === 'MLClassification') as MLClassificationEvent[];
    const avgMlLatency = mlEvents.length ? (mlEvents.reduce((acc, e) => acc + e.durationMs, 0) / mlEvents.length).toFixed(1) : 0;
    const botDetections = mlEvents.filter(e => e.label === 'bot').length;
    
    const routingEvents = events.filter((e) => e.type === 'RoutingDecision') as RoutingDecisionEvent[];
    const avgRoutingLatency = routingEvents.length ? (routingEvents.reduce((acc, e) => acc + e.configLookupDurationMs, 0) / routingEvents.length).toFixed(1) : 0;
    
    const blocks = events.filter((e) => e.type === 'RateLimitBlock').length;
    const completions = events.filter((e) => e.type === 'RequestCompletion') as RequestCompletionEvent[];
    const totalFinished = blocks + completions.length;
    const successRatio = totalFinished > 0 ? (completions.length / totalFinished) * 100 : 0;

    return { mlEvents, avgMlLatency, botDetections, avgRoutingLatency, successRatio };
  }, [events]);

  // ML Confidence Histogram (10 bins)
  const mlHistogram = useMemo(() => {
    const bins = new Array(10).fill(0);
    metrics.mlEvents.forEach(e => {
      const binIdx = Math.min(Math.floor(e.confidence * 10), 9);
      bins[binIdx]++;
    });
    const max = Math.max(...bins, 1); // prevent div by zero
    return { bins, max };
  }, [metrics.mlEvents]);

  const [expandedTraces, setExpandedTraces] = useState<Set<string>>(new Set());
  const toggleTrace = (id: string) => {
    const next = new Set(expandedTraces);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTraces(next);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Live Telemetry</h2>
      </div>
      
      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <Filter className="w-5 h-5 text-muted-foreground hidden md:block" />
          <Input 
            placeholder="Filter by Trace ID..." 
            value={traceIdFilter} 
            onChange={e => setTraceIdFilter(e.target.value)} 
            className="md:w-64"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="EdgeEntry">Edge Entry</SelectItem>
              <SelectItem value="MLClassification">ML Classification</SelectItem>
              <SelectItem value="RoutingDecision">Routing Decision</SelectItem>
              <SelectItem value="RequestCompletion">Completion</SelectItem>
              <SelectItem value="RateLimitBlock">Blocks</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="5m">Last 5 Mins</SelectItem>
              <SelectItem value="15m">Last 15 Mins</SelectItem>
              <SelectItem value="1h">Last 1 Hour</SelectItem>
            </SelectContent>
          </Select>
          <Select value={limitFilter} onValueChange={setLimitFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Limit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">Limit: 50</SelectItem>
              <SelectItem value="100">Limit: 100</SelectItem>
              <SelectItem value="500">Limit: 500</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success vs Blocked</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.successRatio.toFixed(1)}%</div>
            <div className="w-full h-2 bg-red-500/20 rounded-full mt-2 overflow-hidden flex">
              <div className="bg-emerald-500 h-full transition-all" style={{ width: `${metrics.successRatio}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Allowed requests ratio</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Edge Latencies</CardTitle>
            <RouteIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold font-mono text-emerald-400">ML: {metrics.avgMlLatency}ms</div>
            <div className="text-xl font-bold font-mono text-blue-400">KV: {metrics.avgRoutingLatency}ms</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ML Confidence Distribution</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4 flex items-end justify-between h-24 gap-1">
            {mlHistogram.bins.map((count, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div 
                  className="w-full bg-indigo-500/50 hover:bg-indigo-400 transition-all rounded-t-sm" 
                  style={{ height: `${(count / mlHistogram.max) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                />
                <span className="text-[10px] text-muted-foreground">{idx/10}</span>
                {count > 0 && (
                  <div className="absolute -top-6 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    {count}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Traces Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Trace Timeline</CardTitle>
          <CardDescription>Chronological event streams grouped by Request Trace ID.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <div className="text-center p-4 animate-pulse">Loading traces...</div>}
          {isError && <div className="text-center p-4 text-destructive">Error loading telemetry.</div>}
          
          {!isLoading && traces.length === 0 && (
            <div className="text-center p-8 text-muted-foreground border border-dashed rounded-lg">
              No matching telemetry events found.
            </div>
          )}

          {traces.map((trace) => {
            const isExpanded = expandedTraces.has(trace.traceId);
            const entry = trace.events.find(e => e.type === 'EdgeEntry') as any;
            const completion = trace.events.find(e => e.type === 'RequestCompletion') as any;
            const block = trace.events.find(e => e.type === 'RateLimitBlock') as any;
            
            let statusColor = "bg-secondary";
            if (completion?.statusCode === 200 || completion?.statusCode === 302) statusColor = "bg-emerald-500";
            if (completion?.statusCode >= 400 || block) statusColor = "bg-destructive";

            return (
              <div key={trace.traceId} className="border rounded-lg overflow-hidden bg-card">
                <button 
                  onClick={() => toggleTrace(trace.traceId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <div className="font-mono text-sm font-semibold flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                        {trace.traceId.substring(0, 12)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(trace.start).toLocaleTimeString()} - {trace.events.length} event(s)
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry && <Badge variant="outline">{entry.path}</Badge>}
                    {completion && <Badge variant="secondary">{completion.totalDurationMs}ms</Badge>}
                    {block && <Badge variant="destructive">Blocked</Badge>}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="border-t p-4 bg-muted/20 space-y-3">
                    {trace.events.map((e, idx) => (
                      <div key={idx} className="flex gap-4 text-sm font-mono items-start">
                        <div className="w-24 shrink-0 text-muted-foreground text-xs pt-1">
                          +{idx === 0 ? 0 : e.timestamp - trace.events[0].timestamp}ms
                        </div>
                        <div className="shrink-0 pt-0.5">
                          <Badge variant="outline">{e.type}</Badge>
                        </div>
                        <div className="text-muted-foreground break-all">
                          {e.type === 'EdgeEntry' && `IP: ${(e as any).ip} | UA: ${(e as any).userAgent}`}
                          {e.type === 'MLClassification' && `Label: ${(e as any).label} | Score: ${(e as any).score} | Duration: ${(e as any).durationMs}ms`}
                          {e.type === 'RoutingDecision' && `Slug: ${(e as any).slug} -> ${(e as any).targetUrl}`}
                          {e.type === 'RequestCompletion' && `Status: ${(e as any).statusCode}`}
                          {e.type === 'RateLimitBlock' && `IP blocked: ${(e as any).ip}`}
                          {e.type === 'FailOpen' && `Subsystem: ${(e as any).subsystem} | Err: ${(e as any).error}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}


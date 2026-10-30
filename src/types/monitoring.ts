export type ServiceId = 'inventory' | 'orders' | 'payments';

/** Every component of the topology that can report resource usage. */
export type ResourceTarget = ServiceId | 'gateway';

export type CallStatus = 'SUCCESS' | 'ERROR';

export type Health = 'healthy' | 'degraded' | 'critical' | 'idle';

/** Aggregated metrics for one microservice. Rates range from 0 to 100. */
export interface ServiceMetrics {
  service: ServiceId;
  totalCalls: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  errorRate: number;
  avgResponseTimeMs: number;
}

/** A single call intercepted by the monitoring proxy. */
export interface LogEntry {
  requestId: string;
  service: ServiceId;
  operation: string;
  durationMs: number;
  status: CallStatus;
  /** ISO 8601 date */
  timestamp: string;
  input: unknown;
  response: unknown;
  errorMessage?: string;
}

/** CPU and memory usage of one component at a point in time. */
export interface ResourceUsage {
  target: ResourceTarget;
  cpuPercent: number;
  memoryPercent: number;
  memoryUsedMb: number | null;
  memoryTotalMb: number | null;
}

export interface ResourceSnapshot {
  timestamp: number;
  usage: ResourceUsage[];
}

export interface LogFilters {
  service: ServiceId | 'ALL';
  status: CallStatus | 'ALL';
  /** Value of a datetime-local input (yyyy-MM-ddTHH:mm) or an empty string */
  from: string;
  to: string;
}

export interface SimulateLoadResult {
  message: string;
  generatedCalls?: number;
}

export type AlertSeverity = 'critical' | 'warning';

export interface Alert {
  /** Stable key of the condition, e.g. `error-rate:payments` */
  key: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  startedAt: number;
  resolvedAt: number | null;
}

/** Contract implemented by every dashboard data source (real HTTP or mock). */
export interface MonitoringApi {
  getMetrics(signal?: AbortSignal): Promise<ServiceMetrics[]>;
  getLogs(filters: Partial<LogFilters> & { limit?: number }, signal?: AbortSignal): Promise<LogEntry[]>;
  /** Resolves to `null` when the backend does not report resource usage. */
  getResources(signal?: AbortSignal): Promise<ResourceUsage[] | null>;
  simulateLoad(): Promise<SimulateLoadResult>;
}

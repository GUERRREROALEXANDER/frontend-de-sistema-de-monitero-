import { SERVICES, THRESHOLDS } from '../config/services';
import type { Health, LogEntry, ServiceId, ServiceMetrics } from '../types/monitoring';

const HEALTH_RANK: Record<Health, number> = { idle: 0, healthy: 1, degraded: 2, critical: 3 };

export function getHealth(metrics: Pick<ServiceMetrics, 'totalCalls' | 'errorRate' | 'avgResponseTimeMs'>): Health {
  if (metrics.totalCalls === 0) return 'idle';
  if (metrics.errorRate > THRESHOLDS.criticalErrorRate) return 'critical';
  if (metrics.errorRate > THRESHOLDS.degradedErrorRate || metrics.avgResponseTimeMs > THRESHOLDS.degradedLatencyMs) {
    return 'degraded';
  }
  return 'healthy';
}

export function worstHealth(values: Health[]): Health {
  return values.reduce<Health>((worst, h) => (HEALTH_RANK[h] > HEALTH_RANK[worst] ? h : worst), 'idle');
}

/** Gateway view: every call to any service goes through it. */
export function aggregateMetrics(list: ServiceMetrics[]): Omit<ServiceMetrics, 'service'> {
  const totalCalls = list.reduce((acc, m) => acc + m.totalCalls, 0);
  const successCount = list.reduce((acc, m) => acc + m.successCount, 0);
  const errorCount = list.reduce((acc, m) => acc + m.errorCount, 0);
  const weightedLatency = list.reduce((acc, m) => acc + m.avgResponseTimeMs * m.totalCalls, 0);
  return {
    totalCalls,
    successCount,
    errorCount,
    successRate: totalCalls ? (successCount / totalCalls) * 100 : 0,
    errorRate: totalCalls ? (errorCount / totalCalls) * 100 : 0,
    avgResponseTimeMs: totalCalls ? weightedLatency / totalCalls : 0,
  };
}

/** Calls in the last minute, optionally for a single service. */
export function requestsPerMinute(logs: LogEntry[], now: number, service?: ServiceId): number {
  const since = now - 60_000;
  return logs.filter((l) => (!service || l.service === service) && new Date(l.timestamp).getTime() >= since).length;
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function latencyPercentile(logs: LogEntry[], p: number, service?: ServiceId): number {
  return percentile(
    logs.filter((l) => !service || l.service === service).map((l) => l.durationMs),
    p,
  );
}

/** Last N durations of a service, oldest first; used by the card sparklines. */
export function recentDurations(logs: LogEntry[], service: ServiceId, count = 20): number[] {
  return logs
    .filter((l) => l.service === service)
    .slice(0, count)
    .map((l) => l.durationMs)
    .reverse();
}

export type TimeSeriesRow = { time: number } & Record<string, number | null>;

/**
 * Groups calls into fixed time buckets: request count and average latency per service.
 * The window ends now, or at the newest call if the backend has been quiet.
 */
export function buildTimeSeries(logsNewestFirst: LogEntry[], now: number, bucketMs = 15_000, buckets = 20): TimeSeriesRow[] {
  const newest = logsNewestFirst[0] ? new Date(logsNewestFirst[0].timestamp).getTime() : now;
  const windowSpan = bucketMs * buckets;
  const end = Math.ceil((newest < now - windowSpan ? newest : now) / bucketMs) * bucketMs;
  const start = end - windowSpan;

  const rows: TimeSeriesRow[] = Array.from({ length: buckets }, (_, i) => {
    const row: TimeSeriesRow = { time: start + (i + 1) * bucketMs };
    for (const s of SERVICES) {
      row[`${s.id}_req`] = 0;
      row[`${s.id}_lat`] = null;
    }
    return row;
  });
  const latencySums = rows.map(() => new Map<ServiceId, number>());

  for (const log of logsNewestFirst) {
    const t = new Date(log.timestamp).getTime();
    if (t <= start || t > end) continue;
    const index = Math.min(buckets - 1, Math.floor((t - start - 1) / bucketMs));
    const row = rows[index];
    row[`${log.service}_req`] = (row[`${log.service}_req`] ?? 0) + 1;
    latencySums[index].set(log.service, (latencySums[index].get(log.service) ?? 0) + log.durationMs);
  }

  rows.forEach((row, i) => {
    for (const s of SERVICES) {
      const count = row[`${s.id}_req`] ?? 0;
      const sum = latencySums[i].get(s.id);
      row[`${s.id}_lat`] = count > 0 && sum !== undefined ? Math.round(sum / count) : null;
    }
  });
  return rows;
}

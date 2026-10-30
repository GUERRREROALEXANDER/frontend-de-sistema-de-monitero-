import { RESOURCE_TARGETS, SERVICE_BY_ID, THRESHOLDS } from '../config/services';
import { formatMs, formatPercent } from './format';
import type { Alert, AlertSeverity, ResourceUsage, ServiceMetrics } from '../types/monitoring';

interface AlertCondition {
  key: string;
  severity: AlertSeverity;
  title: string;
  message: string;
}

const MAX_ALERTS = 50;

/** Evaluates the current data against the configured thresholds. */
export function evaluateConditions(metrics: ServiceMetrics[], resources: ResourceUsage[] | null): AlertCondition[] {
  const conditions: AlertCondition[] = [];

  for (const m of metrics) {
    if (m.totalCalls === 0) continue;
    const label = SERVICE_BY_ID[m.service].label;
    if (m.errorRate > THRESHOLDS.criticalErrorRate) {
      conditions.push({
        key: `error-rate:${m.service}`,
        severity: 'critical',
        title: `${label} error rate is critical`,
        message: `${formatPercent(m.errorRate)} of calls are failing (threshold ${THRESHOLDS.criticalErrorRate}%).`,
      });
    }
    if (m.avgResponseTimeMs > THRESHOLDS.degradedLatencyMs) {
      conditions.push({
        key: `latency:${m.service}`,
        severity: 'warning',
        title: `${label} is responding slowly`,
        message: `Average latency is ${formatMs(m.avgResponseTimeMs)} (threshold ${THRESHOLDS.degradedLatencyMs} ms).`,
      });
    }
  }

  for (const r of resources ?? []) {
    const label = RESOURCE_TARGETS.find((t) => t.id === r.target)?.label ?? r.target;
    if (r.cpuPercent > THRESHOLDS.cpuWarning) {
      conditions.push({
        key: `cpu:${r.target}`,
        severity: 'warning',
        title: `High CPU on ${label}`,
        message: `CPU usage at ${formatPercent(r.cpuPercent)}.`,
      });
    }
    if (r.memoryPercent > THRESHOLDS.memoryWarning) {
      conditions.push({
        key: `memory:${r.target}`,
        severity: 'warning',
        title: `High memory on ${label}`,
        message: `Memory usage at ${formatPercent(r.memoryPercent)}.`,
      });
    }
  }

  return conditions;
}

/**
 * Merges the current conditions into the alert history: new conditions open an
 * alert, conditions that disappeared resolve it, ongoing ones keep their start time.
 */
export function reconcileAlerts(previous: Alert[], conditions: AlertCondition[], now: number): Alert[] {
  const activeKeys = new Set(conditions.map((c) => c.key));
  const next: Alert[] = previous.map((alert) => {
    if (alert.resolvedAt !== null) return alert;
    if (activeKeys.has(alert.key)) {
      const current = conditions.find((c) => c.key === alert.key);
      return current ? { ...alert, message: current.message } : alert;
    }
    return { ...alert, resolvedAt: now };
  });

  for (const condition of conditions) {
    const open = next.some((a) => a.key === condition.key && a.resolvedAt === null);
    if (!open) next.unshift({ ...condition, startedAt: now, resolvedAt: null });
  }

  return next.slice(0, MAX_ALERTS);
}

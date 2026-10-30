import { SERVICES } from '../config/services';
import { aggregateMetrics, getHealth, latencyPercentile, requestsPerMinute } from './analytics';
import type { Health, LogEntry, ResourceTarget, ServiceId, ServiceMetrics } from '../types/monitoring';

export type NodeKind = 'client' | 'gateway' | 'service' | 'database';

export interface TopologyNode {
  id: string;
  kind: NodeKind;
  label: string;
  sublabel: string;
  health: Health;
  service?: ServiceId;
  resourceTarget?: ResourceTarget;
  totalCalls: number;
  errorRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  rpm: number;
  /** True when the status is derived from the owning service, not measured directly. */
  inferred: boolean;
}

export interface TopologyEdge {
  id: string;
  from: string;
  to: string;
  health: Health;
  rpm: number;
}

export interface Topology {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

export function buildTopology(metrics: ServiceMetrics[], recentLogs: LogEntry[], now: number): Topology {
  const totals = aggregateMetrics(metrics);
  const totalRpm = requestsPerMinute(recentLogs, now);
  const gatewayHealth = getHealth(totals);

  const nodes: TopologyNode[] = [
    {
      id: 'clients',
      kind: 'client',
      label: 'Clients',
      sublabel: 'Web & mobile',
      health: totals.totalCalls > 0 ? 'healthy' : 'idle',
      totalCalls: totals.totalCalls,
      errorRate: 0,
      avgLatencyMs: 0,
      p95LatencyMs: 0,
      rpm: totalRpm,
      inferred: true,
    },
    {
      id: 'gateway',
      kind: 'gateway',
      label: 'API Gateway',
      sublabel: 'Monitoring proxy',
      health: gatewayHealth,
      resourceTarget: 'gateway',
      totalCalls: totals.totalCalls,
      errorRate: totals.errorRate,
      avgLatencyMs: totals.avgResponseTimeMs,
      p95LatencyMs: latencyPercentile(recentLogs, 95),
      rpm: totalRpm,
      inferred: false,
    },
  ];
  const edges: TopologyEdge[] = [{ id: 'clients-gateway', from: 'clients', to: 'gateway', health: gatewayHealth, rpm: totalRpm }];

  for (const meta of SERVICES) {
    const m = metrics.find((x) => x.service === meta.id);
    if (!m) continue;
    const health = getHealth(m);
    const rpm = requestsPerMinute(recentLogs, now, meta.id);
    const p95 = latencyPercentile(recentLogs, 95, meta.id);

    nodes.push({
      id: meta.id,
      kind: 'service',
      label: meta.label,
      sublabel: meta.description,
      health,
      service: meta.id,
      resourceTarget: meta.id,
      totalCalls: m.totalCalls,
      errorRate: m.errorRate,
      avgLatencyMs: m.avgResponseTimeMs,
      p95LatencyMs: p95,
      rpm,
      inferred: false,
    });
    nodes.push({
      id: meta.database,
      kind: 'database',
      label: meta.database,
      sublabel: `Owned by ${meta.label}`,
      // A failing service is often a database symptom, but it is not measured directly.
      health: health === 'critical' ? 'degraded' : health,
      service: meta.id,
      totalCalls: m.totalCalls,
      errorRate: m.errorRate,
      avgLatencyMs: m.avgResponseTimeMs,
      p95LatencyMs: p95,
      rpm,
      inferred: true,
    });
    edges.push({ id: `gateway-${meta.id}`, from: 'gateway', to: meta.id, health, rpm });
    edges.push({ id: `${meta.id}-${meta.database}`, from: meta.id, to: meta.database, health, rpm });
  }

  return { nodes, edges };
}

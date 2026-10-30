import type { ResourceTarget, ServiceId } from '../types/monitoring';

export interface ServiceMeta {
  id: ServiceId;
  label: string;
  description: string;
  database: string;
  /** Series color used in charts */
  color: string;
}

export const SERVICES: readonly ServiceMeta[] = [
  { id: 'inventory', label: 'Inventory', description: 'Stock & availability', database: 'inventory-db', color: '#60a5fa' },
  { id: 'orders', label: 'Orders', description: 'Order lifecycle', database: 'orders-db', color: '#a78bfa' },
  { id: 'payments', label: 'Payments', description: 'Charges & refunds', database: 'payments-db', color: '#f472b6' },
];

export const SERVICE_BY_ID: Record<ServiceId, ServiceMeta> = Object.fromEntries(
  SERVICES.map((s) => [s.id, s]),
) as Record<ServiceId, ServiceMeta>;

export const RESOURCE_TARGETS: readonly { id: ResourceTarget; label: string; color: string }[] = [
  { id: 'gateway', label: 'API Gateway', color: '#22d3ee' },
  ...SERVICES.map((s) => ({ id: s.id, label: s.label, color: s.color })),
];

export const THRESHOLDS = {
  /** Error rate (%) above which a service is critical. */
  criticalErrorRate: 15,
  /** Error rate (%) above which a service is degraded. */
  degradedErrorRate: 5,
  /** Average latency (ms) above which a service is degraded. */
  degradedLatencyMs: 400,
  /** Calls slower than this are highlighted in the logs table. */
  slowCallMs: 500,
  /** CPU (%) above which a warning is raised. */
  cpuWarning: 85,
  /** Memory (%) above which a warning is raised. */
  memoryWarning: 90,
} as const;

/** Number of calls per service shown in the response-time chart. */
export const CHART_WINDOW = 20;

/** Number of resource snapshots kept in memory for the history charts. */
export const RESOURCE_HISTORY_SIZE = 40;

/**
 * In-memory backend. Enabled with VITE_USE_MOCK=true to develop or demo the
 * dashboard without the real backend running.
 */
import { computeMetricsFromLogs } from './normalizers';
import { DEFAULT_FILTERS, filterLogs, sortByNewest } from '../utils/filterLogs';
import type { LogEntry, MonitoringApi, ResourceTarget, ResourceUsage, ServiceId } from '../types/monitoring';

interface ServiceProfile {
  operations: string[];
  baseLatency: number;
  jitter: number;
  errorProbability: number;
}

const PROFILES: Record<ServiceId, ServiceProfile> = {
  inventory: { operations: ['checkStock', 'reserveProduct', 'releaseReservation'], baseLatency: 80, jitter: 90, errorProbability: 0.05 },
  orders: { operations: ['createOrder', 'getOrder', 'cancelOrder'], baseLatency: 140, jitter: 160, errorProbability: 0.1 },
  payments: { operations: ['processPayment', 'verifyPayment', 'refundPayment'], baseLatency: 220, jitter: 260, errorProbability: 0.2 },
};

const SERVICE_IDS = Object.keys(PROFILES) as ServiceId[];
const MAX_STORED = 2000;

let sequence = 0;
const store: LogEntry[] = [];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function buildPayloads(service: ServiceId, operation: string, ok: boolean) {
  const productId = `PRD-${100 + Math.floor(Math.random() * 900)}`;
  const orderId = `ORD-${1000 + Math.floor(Math.random() * 9000)}`;
  const amount = Math.round(Math.random() * 50000) / 100;

  const input =
    service === 'inventory'
      ? { productId, quantity: 1 + Math.floor(Math.random() * 5) }
      : service === 'orders'
        ? { orderId, customerId: `CUS-${Math.floor(Math.random() * 500)}`, items: [{ productId, quantity: 2 }] }
        : { orderId, amount, currency: 'USD', method: randomItem(['CARD', 'BANK_TRANSFER', 'WALLET']) };

  const response = ok
    ? {
        ok: true,
        operation,
        data: service === 'payments' ? { transactionId: crypto.randomUUID(), amount } : { ...input, state: 'PROCESSED' },
      }
    : {
        ok: false,
        error: randomItem(['TimeoutException', 'ServiceUnavailable', 'ValidationError']),
        message: `Failed to execute ${operation}`,
      };

  return { input, response };
}

function createLog(service: ServiceId, at: number): LogEntry {
  const profile = PROFILES[service];
  const operation = randomItem(profile.operations);
  const ok = Math.random() >= profile.errorProbability;
  const duration = profile.baseLatency + Math.random() * profile.jitter + (ok ? 0 : profile.jitter);
  const { input, response } = buildPayloads(service, operation, ok);
  sequence += 1;
  return {
    requestId: `${service.slice(0, 3).toUpperCase()}-${String(sequence).padStart(5, '0')}-${crypto.randomUUID().slice(0, 8)}`,
    service,
    operation,
    durationMs: Math.round(duration * 10) / 10,
    status: ok ? 'SUCCESS' : 'ERROR',
    timestamp: new Date(at).toISOString(),
    input,
    response,
    errorMessage: ok ? undefined : (response as { message: string }).message,
  };
}

/** Recent load, decays over time; drives the simulated CPU usage. */
let loadPressure = 0;

function addCalls(count: number, spreadMs = 0): number {
  const now = Date.now();
  for (let i = 0; i < count; i += 1) {
    const at = now - Math.floor(((count - i) / count) * spreadMs);
    store.push(createLog(randomItem(SERVICE_IDS), at));
  }
  if (store.length > MAX_STORED) store.splice(0, store.length - MAX_STORED);
  return count;
}

const BASE_CPU: Record<ResourceTarget, number> = { gateway: 22, inventory: 18, orders: 30, payments: 41 };
const MEMORY_TOTAL_MB: Record<ResourceTarget, number> = { gateway: 512, inventory: 1024, orders: 1024, payments: 2048 };
const memoryUsage: Record<ResourceTarget, number> = { gateway: 41, inventory: 48, orders: 57, payments: 63 };

function sampleResources(): ResourceUsage[] {
  loadPressure *= 0.82;
  return (Object.keys(BASE_CPU) as ResourceTarget[]).map((target) => {
    const cpu = Math.min(99, BASE_CPU[target] + loadPressure * (target === 'payments' ? 1.2 : 0.9) + (Math.random() - 0.5) * 12);
    memoryUsage[target] = Math.min(96, Math.max(30, memoryUsage[target] + (Math.random() - 0.48) * 2 + loadPressure * 0.04));
    const total = MEMORY_TOTAL_MB[target];
    return {
      target,
      cpuPercent: Math.round(Math.max(1, cpu) * 10) / 10,
      memoryPercent: Math.round(memoryUsage[target] * 10) / 10,
      memoryUsedMb: Math.round((memoryUsage[target] / 100) * total),
      memoryTotalMb: total,
    };
  });
}

function latency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 120 + Math.random() * 180));
}

// Seed history covering the last 30 minutes.
addCalls(75, 30 * 60_000);

export const mockMonitoringApi: MonitoringApi = {
  async getMetrics() {
    await latency();
    // Organic traffic: every poll brings a few new calls.
    addCalls(1 + Math.floor(Math.random() * 4));
    return computeMetricsFromLogs(store);
  },

  async getLogs(filters) {
    await latency();
    const result = sortByNewest(filterLogs(store, { ...DEFAULT_FILTERS, ...filters }));
    return filters.limit ? result.slice(0, filters.limit) : result;
  },

  async getResources() {
    await latency();
    return sampleResources();
  },

  async simulateLoad() {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const generated = addCalls(45, 5_000);
    loadPressure = Math.min(60, loadPressure + 45);
    return { message: `Generated ${generated} simulated calls.`, generatedCalls: generated };
  },
};

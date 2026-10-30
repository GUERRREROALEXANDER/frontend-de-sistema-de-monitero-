/**
 * Adapters between the backend JSON and the dashboard types.
 * They accept common naming variants (English or Spanish camelCase, lists wrapped in
 * `content`/`data`, Jackson dates serialized as arrays, etc.) so the frontend keeps
 * working when the backend contract changes slightly.
 */
import type { CallStatus, LogEntry, ResourceTarget, ResourceUsage, ServiceId, ServiceMetrics } from '../types/monitoring';
import { SERVICES } from '../config/services';

type Raw = Record<string, unknown>;

function isObject(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pick(raw: Raw, keys: string[]): unknown {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
}

function num(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number.parseFloat(value) : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function round(value: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function unwrapList(data: unknown, extraKeys: string[] = []): unknown[] {
  if (Array.isArray(data)) return data;
  if (!isObject(data)) return [];
  for (const key of ['content', 'data', 'items', 'results', ...extraKeys]) {
    const value = data[key];
    if (Array.isArray(value)) return value;
    if (isObject(value)) return unwrapList(value, extraKeys);
  }
  return [];
}

function simplify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function normalizeService(value: unknown): ServiceId | null {
  if (typeof value !== 'string') return null;
  const v = simplify(value);
  if (v.includes('invent')) return 'inventory';
  if (v.includes('pedido') || v.includes('order')) return 'orders';
  if (v.includes('pago') || v.includes('pay')) return 'payments';
  return null;
}

function normalizeTarget(value: unknown): ResourceTarget | null {
  if (typeof value === 'string' && simplify(value).includes('gateway')) return 'gateway';
  return normalizeService(value);
}

function normalizeStatus(raw: Raw): CallStatus {
  const success = pick(raw, ['success', 'successful', 'exitoso']);
  if (typeof success === 'boolean') return success ? 'SUCCESS' : 'ERROR';
  const status = String(pick(raw, ['status', 'estado', 'result']) ?? '').toUpperCase();
  return ['SUCCESS', 'OK', 'EXITO', 'EXITOSO', 'COMPLETED', '200'].includes(status) ? 'SUCCESS' : 'ERROR';
}

function normalizeTimestamp(value: unknown): string {
  if (Array.isArray(value) && value.length >= 3) {
    // LocalDateTime serialized by Jackson: [yyyy, MM, dd, HH, mm, ss, nanos]
    const [y, mo, d, h = 0, mi = 0, s = 0, ns = 0] = value.map((v) => num(v));
    return new Date(y, mo - 1, d, h, mi, s, Math.floor(ns / 1e6)).toISOString();
  }
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

/** Payloads sent as JSON text are parsed so they can be pretty-printed. */
function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

const SERVICE_KEYS = ['service', 'serviceName', 'servicio', 'nombreServicio'];

export function normalizeLog(value: unknown, index: number): LogEntry | null {
  if (!isObject(value)) return null;
  const service = normalizeService(pick(value, SERVICE_KEYS));
  if (!service) return null;

  const errorMessage = pick(value, ['errorMessage', 'error', 'mensajeError']);
  return {
    requestId: String(pick(value, ['requestId', 'id', 'traceId', 'uuid']) ?? `req-${index}`),
    service,
    operation: String(pick(value, ['operation', 'operacion', 'method', 'metodo', 'endpoint']) ?? '—'),
    durationMs: round(num(pick(value, ['durationMs', 'duration', 'duracion', 'responseTimeMs', 'responseTime', 'tiempoRespuesta']))),
    status: normalizeStatus(value),
    timestamp: normalizeTimestamp(pick(value, ['timestamp', 'createdAt', 'fecha', 'date', 'time'])),
    input: parseMaybeJson(pick(value, ['input', 'inputParams', 'parameters', 'params', 'parametros', 'request', 'requestBody'])),
    response: parseMaybeJson(pick(value, ['response', 'output', 'result', 'respuesta', 'responseBody'])),
    errorMessage: errorMessage ? String(errorMessage) : undefined,
  };
}

export function normalizeLogs(data: unknown): LogEntry[] {
  return unwrapList(data, ['logs', 'registros'])
    .map(normalizeLog)
    .filter((log): log is LogEntry => log !== null);
}

function emptyMetrics(service: ServiceId): ServiceMetrics {
  return { service, totalCalls: 0, successCount: 0, errorCount: 0, successRate: 0, errorRate: 0, avgResponseTimeMs: 0 };
}

function finalizeMetrics(service: ServiceId, total: number, success: number, error: number, avg: number): ServiceMetrics {
  return {
    service,
    totalCalls: total,
    successCount: success,
    errorCount: error,
    successRate: round(total > 0 ? (success / total) * 100 : 0),
    errorRate: round(total > 0 ? (error / total) * 100 : 0),
    avgResponseTimeMs: round(avg),
  };
}

function normalizeOneMetric(raw: Raw, fallbackService?: string): ServiceMetrics | null {
  const service = normalizeService(pick(raw, SERVICE_KEYS) ?? fallbackService);
  if (!service) return null;

  const total = num(pick(raw, ['totalCalls', 'total', 'totalRequests', 'totalLlamadas', 'count']));
  let success = num(pick(raw, ['successCount', 'successfulCalls', 'successes', 'exitosas']), Number.NaN);
  let error = num(pick(raw, ['errorCount', 'failedCalls', 'errors', 'errores', 'fallidas']), Number.NaN);

  // When the backend only sends a rate, the counts are rebuilt from it.
  if (Number.isNaN(success) && Number.isNaN(error)) {
    let rate = num(pick(raw, ['successRate', 'tasaExito']), Number.NaN);
    if (Number.isNaN(rate)) rate = 100 - num(pick(raw, ['errorRate', 'tasaError']));
    if (rate <= 1) rate *= 100;
    success = Math.round((rate / 100) * total);
  }
  if (Number.isNaN(success)) success = total - error;
  if (Number.isNaN(error)) error = total - success;

  const avg = num(pick(raw, ['avgResponseTimeMs', 'avgResponseTime', 'averageResponseTime', 'avgDuration', 'tiempoPromedio']));
  return finalizeMetrics(service, total, success, error, avg);
}

/** Always returns the three services, in the configured order. */
function completeServices(list: ServiceMetrics[]): ServiceMetrics[] {
  return SERVICES.map((s) => list.find((m) => m.service === s.id) ?? emptyMetrics(s.id));
}

/** Handles both lists and maps keyed by name: `{ "inventory": { ... } }`. */
function entriesOf(data: unknown, extraKeys: string[]): Array<[Raw, string | undefined]> {
  const list = unwrapList(data, extraKeys).filter(isObject);
  if (list.length > 0) return list.map((raw) => [raw, undefined]);
  if (!isObject(data)) return [];
  return Object.entries(data)
    .filter((entry): entry is [string, Raw] => isObject(entry[1]))
    .map(([key, raw]) => [raw, key]);
}

export function normalizeMetrics(data: unknown): ServiceMetrics[] {
  const list = entriesOf(data, ['metrics', 'services', 'servicios'])
    .map(([raw, key]) => normalizeOneMetric(raw, key))
    .filter((m): m is ServiceMetrics => m !== null);
  return completeServices(list);
}

export function computeMetricsFromLogs(logs: LogEntry[]): ServiceMetrics[] {
  return SERVICES.map(({ id }) => {
    const own = logs.filter((l) => l.service === id);
    const success = own.filter((l) => l.status === 'SUCCESS').length;
    const avg = own.length ? own.reduce((acc, l) => acc + l.durationMs, 0) / own.length : 0;
    return finalizeMetrics(id, own.length, success, own.length - success, avg);
  });
}

export function normalizeResources(data: unknown): ResourceUsage[] {
  return entriesOf(data, ['resources', 'recursos'])
    .map(([raw, key]): ResourceUsage | null => {
      const target = normalizeTarget(pick(raw, [...SERVICE_KEYS, 'target', 'name', 'component']) ?? key);
      if (!target) return null;
      let cpu = num(pick(raw, ['cpuPercent', 'cpu', 'cpuUsage', 'usoCpu']));
      if (cpu > 0 && cpu <= 1) cpu *= 100;
      const used = num(pick(raw, ['memoryUsedMb', 'memoryUsed', 'heapUsedMb', 'memoriaUsada']), Number.NaN);
      const total = num(pick(raw, ['memoryTotalMb', 'memoryMax', 'heapMaxMb', 'memoriaTotal']), Number.NaN);
      let memory = num(pick(raw, ['memoryPercent', 'memory', 'memoryUsage', 'usoMemoria']), Number.NaN);
      if (Number.isNaN(memory)) memory = total > 0 ? (used / total) * 100 : 0;
      if (memory > 0 && memory <= 1) memory *= 100;
      return {
        target,
        cpuPercent: round(clampPercent(cpu)),
        memoryPercent: round(clampPercent(memory)),
        memoryUsedMb: Number.isNaN(used) ? null : round(used, 0),
        memoryTotalMb: Number.isNaN(total) ? null : round(total, 0),
      };
    })
    .filter((r): r is ResourceUsage => r !== null);
}

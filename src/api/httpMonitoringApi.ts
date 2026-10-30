import axios from 'axios';
import { httpClient } from './httpClient';
import { computeMetricsFromLogs, normalizeLogs, normalizeMetrics, normalizeResources } from './normalizers';
import { localInputToTime } from '../utils/filterLogs';
import type { MonitoringApi, SimulateLoadResult } from '../types/monitoring';

/** Backend routes. Change them here if the backend exposes different paths. */
export const ENDPOINTS = {
  metrics: '/api/metrics',
  logs: '/api/logs',
  resources: '/api/metrics/resources',
  simulateLoad: '/api/metrics/simulate-load',
} as const;

const FALLBACK_LOG_LIMIT = 1000;

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 501);
}

/** Once the backend answers 404 for resources, it is not asked again in this session. */
let resourcesSupported = true;

export const httpMonitoringApi: MonitoringApi = {
  async getMetrics(signal) {
    try {
      const { data } = await httpClient.get(ENDPOINTS.metrics, { signal });
      return normalizeMetrics(data);
    } catch (error) {
      // Without an aggregated endpoint, metrics are computed from the logs.
      if (!isNotFound(error)) throw error;
      const { data } = await httpClient.get(ENDPOINTS.logs, { signal, params: { limit: FALLBACK_LOG_LIMIT } });
      return computeMetricsFromLogs(normalizeLogs(data));
    }
  },

  async getLogs(filters, signal) {
    const from = localInputToTime(filters.from ?? '');
    const to = localInputToTime(filters.to ?? '');
    const params: Record<string, string | number> = {};
    if (filters.service && filters.service !== 'ALL') params.service = filters.service;
    if (filters.status && filters.status !== 'ALL') params.status = filters.status;
    if (from !== null) params.from = new Date(from).toISOString();
    if (to !== null) params.to = new Date(to + 59_999).toISOString();
    if (filters.limit) params.limit = filters.limit;

    const { data } = await httpClient.get(ENDPOINTS.logs, { signal, params });
    return normalizeLogs(data);
  },

  async getResources(signal) {
    if (!resourcesSupported) return null;
    try {
      const { data } = await httpClient.get(ENDPOINTS.resources, { signal });
      return normalizeResources(data);
    } catch (error) {
      if (!isNotFound(error)) throw error;
      resourcesSupported = false;
      return null;
    }
  },

  async simulateLoad(): Promise<SimulateLoadResult> {
    const { data } = await httpClient.post(ENDPOINTS.simulateLoad);
    if (data && typeof data === 'object') {
      const body = data as { message?: string; generatedCalls?: number; totalCalls?: number; calls?: number };
      return {
        message: body.message ?? 'Load simulation completed.',
        generatedCalls: body.generatedCalls ?? body.totalCalls ?? body.calls,
      };
    }
    return { message: typeof data === 'string' && data ? data : 'Load simulation completed.' };
  },
};

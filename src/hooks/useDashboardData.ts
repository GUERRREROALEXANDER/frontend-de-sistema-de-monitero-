import { useCallback, useEffect, useRef, useState } from 'react';
import { describeError, isAbortError, monitoringApi } from '../api';
import { env } from '../config/env';
import { RESOURCE_HISTORY_SIZE } from '../config/services';
import { evaluateConditions, reconcileAlerts } from '../utils/alerts';
import { filterLogs, hasActiveFilters, sortByNewest } from '../utils/filterLogs';
import { usePolling } from './usePolling';
import type { Alert, LogEntry, LogFilters, ResourceSnapshot, ResourceUsage, ServiceMetrics } from '../types/monitoring';

/** Recent unfiltered logs that feed the charts and the topology. */
const RECENT_LOGS_LIMIT = 300;
/** Maximum logs requested for the filtered table. */
const TABLE_LOGS_LIMIT = 500;

export type LoadStatus = 'loading' | 'ready' | 'error';

interface State {
  status: LoadStatus;
  metrics: ServiceMetrics[];
  recentLogs: LogEntry[];
  tableLogs: LogEntry[];
  /** `null` while the backend does not report CPU / memory. */
  resources: ResourceUsage[] | null;
  resourceHistory: ResourceSnapshot[];
  alerts: Alert[];
  error: string | null;
  isFetching: boolean;
  lastUpdated: number | null;
}

export interface DashboardData extends State {
  refresh: () => Promise<void>;
}

const INITIAL_STATE: State = {
  status: 'loading',
  metrics: [],
  recentLogs: [],
  tableLogs: [],
  resources: null,
  resourceHistory: [],
  alerts: [],
  error: null,
  isFetching: false,
  lastUpdated: null,
};

/** Resource usage is optional: a failure there must not take the whole dashboard down. */
async function safeResources(signal: AbortSignal): Promise<ResourceUsage[] | null> {
  try {
    return await monitoringApi.getResources(signal);
  } catch (error) {
    if (isAbortError(error)) throw error;
    return null;
  }
}

export function useDashboardData(filters: LogFilters): DashboardData {
  const [state, setState] = useState<State>(INITIAL_STATE);
  const filtersRef = useRef(filters);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  /**
   * `force` cancels the request in flight (filter change, manual refresh).
   * Polling does not force: if a request is still running, that tick is skipped.
   */
  const load = useCallback(async (force: boolean) => {
    if (controllerRef.current && !force) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const { signal } = controller;
    const currentFilters = filtersRef.current;

    await Promise.resolve();
    setState((s) => ({ ...s, isFetching: true }));

    try {
      const filtered = hasActiveFilters(currentFilters);
      const [metrics, recent, table, resources] = await Promise.all([
        monitoringApi.getMetrics(signal),
        monitoringApi.getLogs({ limit: RECENT_LOGS_LIMIT }, signal),
        filtered ? monitoringApi.getLogs({ ...currentFilters, limit: TABLE_LOGS_LIMIT }, signal) : null,
        safeResources(signal),
      ]);
      if (signal.aborted) return;

      const now = Date.now();
      const recentSorted = sortByNewest(recent);
      // Filters are also applied client-side in case the backend ignores a parameter.
      const tableLogs = sortByNewest(filterLogs(table ?? recentSorted, currentFilters));

      setState((s) => ({
        status: 'ready',
        metrics,
        recentLogs: recentSorted,
        tableLogs,
        resources,
        resourceHistory: resources
          ? [...s.resourceHistory, { timestamp: now, usage: resources }].slice(-RESOURCE_HISTORY_SIZE)
          : s.resourceHistory,
        alerts: reconcileAlerts(s.alerts, evaluateConditions(metrics, resources), now),
        error: null,
        isFetching: false,
        lastUpdated: now,
      }));
    } catch (error) {
      if (isAbortError(error) || signal.aborted) return;
      setState((s) => ({
        ...s,
        status: s.lastUpdated === null ? 'error' : s.status,
        error: describeError(error),
        isFetching: false,
      }));
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }, []);

  // Initial load, and an immediate reload whenever the filters change.
  useEffect(() => {
    void load(true);
  }, [filters, load]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const poll = useCallback(() => {
    void load(false);
  }, [load]);
  usePolling(poll, env.pollingIntervalMs);

  const refresh = useCallback(() => load(true), [load]);

  return { ...state, refresh };
}

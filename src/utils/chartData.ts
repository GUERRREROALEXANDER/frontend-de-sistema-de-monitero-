import { CHART_WINDOW, SERVICES } from '../config/services';
import type { LogEntry, ServiceId } from '../types/monitoring';

/** One chart row: call position (1 = oldest) and the duration per service. */
export type ChartRow = { call: number } & Partial<Record<ServiceId, number>> & {
  logs: Partial<Record<ServiceId, LogEntry>>;
};

/**
 * Takes the last `CHART_WINDOW` calls of each service (logs arrive newest first)
 * and aligns them by position for a line chart.
 */
export function buildChartRows(logsNewestFirst: LogEntry[]): ChartRow[] {
  const perService = new Map<ServiceId, LogEntry[]>(
    SERVICES.map(({ id }) => [id, logsNewestFirst.filter((l) => l.service === id).slice(0, CHART_WINDOW).reverse()]),
  );
  const length = Math.max(0, ...[...perService.values()].map((list) => list.length));

  return Array.from({ length }, (_, i) => {
    const row: ChartRow = { call: i + 1, logs: {} };
    for (const [service, list] of perService) {
      const log = list[i];
      if (log) {
        row[service] = log.durationMs;
        row.logs[service] = log;
      }
    }
    return row;
  });
}

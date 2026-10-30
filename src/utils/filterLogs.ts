import type { LogEntry, LogFilters } from '../types/monitoring';

export const DEFAULT_FILTERS: LogFilters = { service: 'ALL', status: 'ALL', from: '', to: '' };

export function hasActiveFilters(filters: LogFilters): boolean {
  return filters.service !== 'ALL' || filters.status !== 'ALL' || filters.from !== '' || filters.to !== '';
}

/** Converts a datetime-local input value (local time) to epoch milliseconds. */
export function localInputToTime(value: string): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export function filterLogs(logs: LogEntry[], filters: LogFilters): LogEntry[] {
  const from = localInputToTime(filters.from);
  // "To" includes the whole selected minute.
  const toBase = localInputToTime(filters.to);
  const to = toBase === null ? null : toBase + 59_999;

  return logs.filter((log) => {
    if (filters.service !== 'ALL' && log.service !== filters.service) return false;
    if (filters.status !== 'ALL' && log.status !== filters.status) return false;
    const time = new Date(log.timestamp).getTime();
    if (from !== null && time < from) return false;
    if (to !== null && time > to) return false;
    return true;
  });
}

export function sortByNewest(logs: LogEntry[]): LogEntry[] {
  return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

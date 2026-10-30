import { Fragment, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { SERVICE_BY_ID, THRESHOLDS } from '../../config/services';
import { formatMs, formatNumber, formatTime } from '../../utils/format';
import { Skeleton } from '../ui/Skeleton';
import { StatusBadge } from '../ui/StatusBadge';
import { LogDetail } from './LogDetail';
import type { LogEntry } from '../../types/monitoring';

const PAGE_SIZE = 15;

const COLUMNS = ['', 'Time', 'Request ID', 'Service', 'Operation', 'Duration', 'Status'];

interface LogsTableProps {
  logs: LogEntry[];
  loading: boolean;
}

export function LogsTable({ logs, loading }: LogsTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [requestedPage, setPage] = useState(0);

  const pageCount = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  // When filters shrink the results, the page is clamped without an extra effect.
  const page = Math.min(requestedPage, pageCount - 1);
  const visible = logs.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const toggle = (id: string) => setExpandedId((current) => (current === id ? null : id));

  if (loading) {
    return (
      <div className="space-y-2 px-5 pb-5 sm:px-6">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-muted flex flex-col items-center gap-2 px-5 py-16 text-center text-sm">
        <Inbox className="size-8 text-amber-500/60" aria-hidden />
        No records match the current filters.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="text-muted border-y border-stone-900/5 bg-stone-900/[0.02] text-[11px] uppercase tracking-wider dark:border-white/5 dark:bg-white/[0.02]">
            <tr>
              {COLUMNS.map((c, i) => (
                <th key={c || i} scope="col" className={`px-4 py-3 font-semibold ${c === 'Duration' ? 'text-right' : ''}`}>
                  {c || <span className="sr-only">Expand</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-900/5 dark:divide-white/5">
            <AnimatePresence initial={false}>
              {visible.map((log) => {
                const expanded = expandedId === log.requestId;
                const service = SERVICE_BY_ID[log.service];
                const slow = log.durationMs > THRESHOLDS.slowCallMs;
                const error = log.status === 'ERROR';
                return (
                  <Fragment key={log.requestId}>
                    <motion.tr
                      layout="position"
                      initial={{ opacity: 0, backgroundColor: 'rgba(251, 191, 36, 0.18)' }}
                      animate={{ opacity: 1, backgroundColor: 'rgba(251, 191, 36, 0)' }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      onClick={() => toggle(log.requestId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggle(log.requestId);
                        }
                      }}
                      tabIndex={0}
                      aria-expanded={expanded}
                      className={`cursor-pointer border-l-2 transition-colors hover:bg-amber-400/[0.06]! focus-visible:bg-amber-400/[0.06]! ${
                        expanded ? 'bg-amber-400/[0.08]!' : ''
                      } ${error ? 'border-l-coral-500' : 'border-l-transparent'}`}
                    >
                      <td className="text-muted w-10 px-4 py-3">
                        <motion.span className="inline-flex" animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="size-4" aria-hidden />
                        </motion.span>
                      </td>
                      <td className="text-muted whitespace-nowrap px-4 py-3 tabular-nums">{formatTime(log.timestamp)}</td>
                      <td className="max-w-48 truncate px-4 py-3 font-mono text-xs" title={log.requestId}>
                        {log.requestId}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-2 font-medium">
                          <span className="size-2 rounded-full" style={{ backgroundColor: service.color, boxShadow: `0 0 8px ${service.color}` }} />
                          {service.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{log.operation}</td>
                      <td
                        className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${
                          slow ? 'text-orange-600 dark:text-orange-400' : ''
                        }`}
                      >
                        {formatMs(log.durationMs)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>
                    </motion.tr>
                    <AnimatePresence initial={false}>
                      {expanded && (
                        <tr>
                          <td colSpan={COLUMNS.length} className="p-0">
                            <LogDetail log={log} />
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <footer className="text-muted flex flex-wrap items-center justify-between gap-3 border-t border-stone-900/5 px-5 py-3 text-xs sm:px-6 dark:border-white/5">
        <span>
          Showing {formatNumber(page * PAGE_SIZE + 1)}–{formatNumber(page * PAGE_SIZE + visible.length)} of {formatNumber(logs.length)} records
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            className="grid size-8 place-items-center rounded-lg ring-1 ring-inset ring-stone-900/10 transition hover:bg-amber-400/10 disabled:opacity-35 dark:ring-white/10"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="px-2 tabular-nums">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(page + 1)}
            disabled={page >= pageCount - 1}
            className="grid size-8 place-items-center rounded-lg ring-1 ring-inset ring-stone-900/10 transition hover:bg-amber-400/10 disabled:opacity-35 dark:ring-white/10"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </footer>
    </>
  );
}

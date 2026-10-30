import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, Info, MousePointerClick } from 'lucide-react';
import { formatMs, formatNumber, formatPercent } from '../../utils/format';
import { HealthBadge } from '../ui/HealthBadge';
import { RadialGauge } from '../ui/RadialGauge';
import { THRESHOLDS } from '../../config/services';
import type { LogEntry, ResourceUsage, ServiceId } from '../../types/monitoring';
import type { TopologyNode } from '../../utils/topology';

interface NodeDetailsProps {
  node: TopologyNode | null;
  resources: ResourceUsage[] | null;
  recentLogs: LogEntry[];
  onOpenLogs: (service: ServiceId) => void;
}

function topOperations(logs: LogEntry[], service: ServiceId) {
  const counts = new Map<string, { total: number; errors: number }>();
  for (const log of logs) {
    if (log.service !== service) continue;
    const entry = counts.get(log.operation) ?? { total: 0, errors: 0 };
    entry.total += 1;
    if (log.status === 'ERROR') entry.errors += 1;
    counts.set(log.operation, entry);
  }
  return [...counts.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 4);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-night-900/4 p-3 dark:bg-white/4">
      <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      <p className="mt-1 font-display text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}

export function NodeDetails({ node, resources, recentLogs, onOpenLogs }: NodeDetailsProps) {
  const usage = node?.resourceTarget ? resources?.find((r) => r.target === node.resourceTarget) : undefined;
  const operations = node?.kind === 'service' && node.service ? topOperations(recentLogs, node.service) : [];
  const maxOps = Math.max(1, ...operations.map(([, v]) => v.total));

  return (
    <AnimatePresence mode="wait">
      {!node ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-muted flex h-full min-h-64 flex-col items-center justify-center gap-2 p-6 text-center text-sm"
        >
          <MousePointerClick className="size-8 text-brand-500" aria-hidden />
          Select a node in the map to inspect it.
        </motion.div>
      ) : (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
          className="space-y-4 p-5 sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted text-[11px] font-semibold uppercase tracking-wider">{node.kind}</p>
              <h3 className="text-xl font-extrabold tracking-tight">{node.label}</h3>
              <p className="text-muted text-sm">{node.sublabel}</p>
            </div>
            <HealthBadge health={node.health} />
          </div>

          {node.inferred && node.kind !== 'client' && (
            <p className="flex gap-2 rounded-xl bg-brand-400/10 p-3 text-xs text-brand-800 dark:text-brand-200">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Not measured directly: status is inferred from the traffic of the owning service.
            </p>
          )}

          {node.kind !== 'client' && (
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Calls" value={formatNumber(node.totalCalls)} />
              <Stat label="Error rate" value={formatPercent(node.errorRate)} />
              <Stat label="Avg latency" value={formatMs(node.avgLatencyMs)} />
              <Stat label="p95 latency" value={formatMs(node.p95LatencyMs)} />
            </div>
          )}
          {node.kind === 'client' && <Stat label="Requests per minute" value={formatNumber(node.rpm)} />}

          {usage && (
            <div className="flex justify-around rounded-2xl bg-night-900/4 py-4 dark:bg-white/4">
              <RadialGauge value={usage.cpuPercent} label="CPU" warnAt={THRESHOLDS.cpuWarning - 15} criticalAt={THRESHOLDS.cpuWarning} size={96} />
              <RadialGauge
                value={usage.memoryPercent}
                label="Memory"
                warnAt={THRESHOLDS.memoryWarning - 15}
                criticalAt={THRESHOLDS.memoryWarning}
                size={96}
              />
            </div>
          )}

          {operations.length > 0 && (
            <div>
              <p className="text-muted mb-2 text-[11px] font-semibold uppercase tracking-wider">Top operations</p>
              <ul className="space-y-2">
                {operations.map(([name, value]) => (
                  <li key={name} className="text-xs">
                    <div className="mb-1 flex justify-between">
                      <span className="font-mono">{name}</span>
                      <span className="text-muted tabular-nums">
                        {value.total} calls{value.errors > 0 && <span className="text-danger-500"> · {value.errors} err</span>}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-night-900/8 dark:bg-white/8">
                      <motion.div
                        className="h-full rounded-full bg-linear-to-r from-brand-400 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(value.total / maxOps) * 100}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {node.service && (
            <button
              type="button"
              onClick={() => onOpenLogs(node.service as ServiceId)}
              className="group inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-400/15 px-4 py-2.5 text-sm font-semibold text-brand-800 ring-1 ring-inset ring-brand-500/25 transition hover:bg-brand-400/25 dark:text-brand-200"
            >
              {node.kind === 'database' ? 'Open service logs' : 'Open logs'}
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

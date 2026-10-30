import { motion } from 'motion/react';
import { Activity, CheckCircle2, Gauge, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { THRESHOLDS } from '../../config/services';
import { aggregateMetrics, latencyPercentile, requestsPerMinute } from '../../utils/analytics';
import { formatMs, formatNumber, formatPercent } from '../../utils/format';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { Skeleton } from '../ui/Skeleton';
import { Sparkline } from '../ui/Sparkline';
import { fadeUp } from '../ui/motion';
import type { LogEntry, ServiceMetrics } from '../../types/monitoring';

interface KpiStripProps {
  metrics: ServiceMetrics[];
  recentLogs: LogEntry[];
  throughputTrend: number[];
  latencyTrend: number[];
  now: number;
  loading: boolean;
}

interface KpiProps {
  icon: ReactNode;
  label: string;
  value: number;
  format: (value: number) => string;
  hint: string;
  accent: string;
  trend?: number[];
  danger?: boolean;
}

function Kpi({ icon, label, value, format, hint, accent, trend, danger = false }: KpiProps) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`glass relative overflow-hidden rounded-3xl p-5 ${danger ? 'ring-1 ring-danger-500/50' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-muted text-xs font-semibold uppercase tracking-wider">{label}</span>
        <span className="grid size-8 place-items-center rounded-xl" style={{ backgroundColor: `${accent}22`, color: accent }}>
          {icon}
        </span>
      </div>
      <AnimatedNumber
        value={value}
        format={format}
        className={`mt-3 block font-display text-3xl font-extrabold tabular-nums tracking-tight ${danger ? 'text-danger-500' : ''}`}
      />
      <p className="text-muted mt-1 text-xs">{hint}</p>
      {trend && <Sparkline values={trend} color={accent} className="-mx-5 -mb-5 mt-3 w-[calc(100%+2.5rem)]" height={34} />}
    </motion.div>
  );
}

export function KpiStrip({ metrics, recentLogs, throughputTrend, latencyTrend, now, loading }: KpiStripProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>
    );
  }

  const totals = aggregateMetrics(metrics);
  const rpm = requestsPerMinute(recentLogs, now);
  const p95 = latencyPercentile(recentLogs, 95);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        icon={<Activity className="size-4" />}
        label="Total requests"
        value={totals.totalCalls}
        format={formatNumber}
        hint={`${formatNumber(totals.errorCount)} failed across all services`}
        accent="#3b82f6"
      />
      <Kpi
        icon={<CheckCircle2 className="size-4" />}
        label="Success rate"
        value={totals.successRate}
        format={formatPercent}
        hint={`Error rate ${formatPercent(totals.errorRate)}`}
        accent={totals.errorRate > THRESHOLDS.criticalErrorRate ? '#ef4444' : '#10b981'}
        danger={totals.errorRate > THRESHOLDS.criticalErrorRate}
      />
      <Kpi
        icon={<Timer className="size-4" />}
        label="Avg latency"
        value={totals.avgResponseTimeMs}
        format={formatMs}
        hint={`p95 ${formatMs(p95)} over the last ${recentLogs.length} calls`}
        accent="#f59e0b"
        trend={latencyTrend}
      />
      <Kpi
        icon={<Gauge className="size-4" />}
        label="Throughput"
        value={rpm}
        format={(v) => `${formatNumber(v)} rpm`}
        hint="Requests in the last minute"
        accent="#22d3ee"
        trend={throughputTrend}
      />
    </div>
  );
}

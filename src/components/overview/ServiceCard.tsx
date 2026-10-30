import { motion } from 'motion/react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { SERVICE_BY_ID, THRESHOLDS } from '../../config/services';
import { getHealth } from '../../utils/analytics';
import { formatMs, formatNumber, formatPercent } from '../../utils/format';
import { AnimatedNumber } from '../ui/AnimatedNumber';
import { HealthBadge } from '../ui/HealthBadge';
import { ServiceIcon } from '../ui/ServiceIcon';
import { Sparkline } from '../ui/Sparkline';
import { fadeUp } from '../ui/motion';
import type { ServiceMetrics } from '../../types/monitoring';

interface ServiceCardProps {
  metrics: ServiceMetrics;
  durations: number[];
  requestsPerMinute: number;
  onOpenLogs: () => void;
}

/** Inset glow: the card clips its overflow, so an outer shadow would be cut off. */
const CRITICAL_GLOW = [
  'inset 0 0 0 2px rgba(255, 61, 113, 0.75), inset 0 0 36px rgba(255, 61, 113, 0.35)',
  'inset 0 0 0 1px rgba(255, 61, 113, 0.25), inset 0 0 12px rgba(255, 61, 113, 0.05)',
  'inset 0 0 0 2px rgba(255, 61, 113, 0.75), inset 0 0 36px rgba(255, 61, 113, 0.35)',
];

export function ServiceCard({ metrics, durations, requestsPerMinute, onOpenLogs }: ServiceCardProps) {
  const meta = SERVICE_BY_ID[metrics.service];
  const health = getHealth(metrics);
  const critical = health === 'critical';

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className={`glass relative overflow-hidden rounded-3xl p-5 ${
        critical ? 'border-danger-500/60! bg-danger-500/8! dark:bg-danger-500/10!' : ''
      }`}
      aria-label={`${meta.label} service, ${health}`}
    >
      {/* The pulse lives on its own layer so it never overrides the entrance variants. */}
      {critical && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          animate={{ boxShadow: CRITICAL_GLOW }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden
        />
      )}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full blur-3xl"
        style={{ backgroundColor: critical ? '#ff3d71' : meta.color, opacity: 0.18 }}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid size-11 place-items-center rounded-2xl ring-1 ring-inset"
            style={{ backgroundColor: `${meta.color}22`, color: meta.color, ['--tw-ring-color' as string]: `${meta.color}44` }}
          >
            <ServiceIcon kind={metrics.service} className="size-5" />
          </div>
          <div>
            <h3 className="font-bold tracking-tight">{meta.label}</h3>
            <p className="text-muted text-xs">{meta.description}</p>
          </div>
        </div>
        <HealthBadge health={health} />
      </div>

      <dl className="relative mt-5 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-muted text-[11px] font-semibold uppercase tracking-wider">Calls</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums">
            <AnimatedNumber value={metrics.totalCalls} format={formatNumber} />
          </dd>
        </div>
        <div>
          <dt className="text-muted text-[11px] font-semibold uppercase tracking-wider">Success</dt>
          <dd className={`mt-1 font-display text-2xl font-extrabold tabular-nums ${critical ? 'text-danger-500' : 'text-emerald-500'}`}>
            <AnimatedNumber value={metrics.successRate} format={formatPercent} />
          </dd>
        </div>
        <div>
          <dt className="text-muted text-[11px] font-semibold uppercase tracking-wider">Avg time</dt>
          <dd className="mt-1 font-display text-2xl font-extrabold tabular-nums">
            <AnimatedNumber value={metrics.avgResponseTimeMs} format={formatMs} />
          </dd>
        </div>
      </dl>

      <Sparkline values={durations} color={critical ? '#ff3d71' : meta.color} className="relative mt-4 w-full" height={42} />

      <div className="relative mt-3">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="text-muted">
            {formatNumber(metrics.errorCount)} errors · {formatNumber(requestsPerMinute)} rpm
          </span>
          <span className={`font-bold ${critical ? 'text-danger-500' : 'text-muted'}`}>{formatPercent(metrics.errorRate)} error</span>
        </div>
        <div
          className="flex h-2 overflow-hidden rounded-full bg-night-900/8 dark:bg-white/8"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={metrics.successRate}
          aria-label="Success rate"
        >
          <motion.div
            className="h-full bg-linear-to-r from-emerald-400 to-emerald-500"
            animate={{ width: `${metrics.successRate}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="h-full bg-linear-to-r from-pink-500 to-danger-500"
            animate={{ width: `${metrics.errorRate}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-2">
        {critical ? (
          <p className="flex items-center gap-1.5 text-xs font-semibold text-danger-600 dark:text-danger-300">
            <AlertTriangle className="size-3.5" aria-hidden />
            Error rate above {THRESHOLDS.criticalErrorRate}%
          </p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onOpenLogs}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-danger-600 dark:text-brand-300 dark:hover:text-danger-300"
        >
          View logs
          <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </button>
      </div>
    </motion.article>
  );
}

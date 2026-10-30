import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, BellRing, CheckCircle2, Flame } from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import { formatRelative } from '../../utils/format';
import { GlassCard } from '../ui/GlassCard';
import { PulseDot } from '../ui/PulseDot';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { Alert } from '../../types/monitoring';

type AlertFilter = 'active' | 'all';

const SEVERITY_STYLES = {
  critical: { icon: Flame, color: '#ff3d71', chip: 'bg-danger-500/15 text-danger-700 dark:text-danger-300' },
  warning: { icon: AlertTriangle, color: '#fbbf24', chip: 'bg-amber-400/15 text-amber-700 dark:text-amber-300' },
} as const;

export function AlertsFeed({ alerts, className = '' }: { alerts: Alert[]; className?: string }) {
  const [filter, setFilter] = useState<AlertFilter>('active');
  const now = useNow(5000);
  const active = alerts.filter((a) => a.resolvedAt === null);
  const visible = filter === 'active' ? active : alerts;

  return (
    <GlassCard
      className={className}
      icon={<BellRing className="size-4.5" />}
      title="Alerts"
      subtitle="Raised automatically from live thresholds"
      actions={
        <SegmentedControl
          size="sm"
          label="Alert filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'active', label: 'Active', count: active.length },
            { value: 'all', label: 'History', count: alerts.length },
          ]}
        />
      }
    >
      <ul className="max-h-[22rem] space-y-2 overflow-y-auto px-5 pb-5 pt-2 sm:px-6">
        <AnimatePresence initial={false} mode="popLayout">
          {visible.length === 0 && (
            <motion.li
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 py-10 text-center text-sm"
            >
              <CheckCircle2 className="size-8 text-emerald-500" aria-hidden />
              <span className="font-semibold">All systems nominal</span>
              <span className="text-muted text-xs">No thresholds are being exceeded right now.</span>
            </motion.li>
          )}
          {visible.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity];
            const Icon = style.icon;
            const resolved = alert.resolvedAt !== null;
            return (
              <motion.li
                key={`${alert.key}-${alert.startedAt}`}
                layout
                initial={{ opacity: 0, x: 24, scale: 0.97 }}
                animate={{ opacity: resolved ? 0.55 : 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className="flex gap-3 rounded-2xl bg-night-900/3 p-3 ring-1 ring-inset ring-night-900/5 dark:bg-white/3 dark:ring-white/5"
              >
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${style.chip}`}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!resolved && <PulseDot color={style.color} fast={alert.severity === 'critical'} size={7} />}
                    <p className="truncate text-sm font-semibold">{alert.title}</p>
                  </div>
                  <p className="text-muted mt-0.5 text-xs">{alert.message}</p>
                  <p className="text-muted mt-1 text-[11px]">
                    {resolved ? `Resolved ${formatRelative(alert.resolvedAt as number, now)}` : `Firing since ${formatRelative(alert.startedAt, now)}`}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </GlassCard>
  );
}

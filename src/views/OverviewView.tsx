import { useMemo } from 'react';
import { motion } from 'motion/react';
import { SERVICES } from '../config/services';
import { buildTimeSeries, recentDurations, requestsPerMinute } from '../utils/analytics';
import { AlertsFeed } from '../components/overview/AlertsFeed';
import { KpiStrip } from '../components/overview/KpiStrip';
import { ResponseTimeChart } from '../components/overview/ResponseTimeChart';
import { ServiceCard } from '../components/overview/ServiceCard';
import { ThroughputChart } from '../components/overview/ThroughputChart';
import { Skeleton } from '../components/ui/Skeleton';
import { staggerContainer } from '../components/ui/motion';
import type { Alert, LogEntry, ServiceId, ServiceMetrics } from '../types/monitoring';

interface OverviewViewProps {
  metrics: ServiceMetrics[];
  recentLogs: LogEntry[];
  alerts: Alert[];
  lastUpdated: number | null;
  loading: boolean;
  isDark: boolean;
  onOpenLogs: (service: ServiceId) => void;
}

export function OverviewView({ metrics, recentLogs, alerts, lastUpdated, loading, isDark, onOpenLogs }: OverviewViewProps) {
  // Derived values follow the data refresh, not the wall clock, so they stay stable between polls.
  const now = lastUpdated ?? 0;
  const series = useMemo(() => buildTimeSeries(recentLogs, now), [recentLogs, now]);
  const throughputTrend = series.map((row) => SERVICES.reduce((acc, s) => acc + (row[`${s.id}_req`] ?? 0), 0));
  const latencyTrend = series
    .map((row) => {
      const values = SERVICES.map((s) => row[`${s.id}_lat`]).filter((v): v is number => v !== null);
      return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    })
    .filter((v): v is number => v !== null);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <KpiStrip
        metrics={metrics}
        recentLogs={recentLogs}
        throughputTrend={throughputTrend}
        latencyTrend={latencyTrend}
        now={now}
        loading={loading}
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {SERVICES.map((s) => (
            <Skeleton key={s.id} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : (
        <motion.div variants={staggerContainer} className="grid gap-4 md:grid-cols-3">
          {metrics.map((m) => (
            <ServiceCard
              key={m.service}
              metrics={m}
              durations={recentDurations(recentLogs, m.service)}
              requestsPerMinute={requestsPerMinute(recentLogs, now, m.service)}
              onOpenLogs={() => onOpenLogs(m.service)}
            />
          ))}
        </motion.div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ThroughputChart rows={series} loading={loading} isDark={isDark} />
        </div>
        <AlertsFeed alerts={alerts} />
      </div>

      <ResponseTimeChart logs={recentLogs} loading={loading} isDark={isDark} />
    </motion.div>
  );
}

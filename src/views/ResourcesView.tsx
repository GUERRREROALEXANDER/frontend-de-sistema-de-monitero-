import { motion } from 'motion/react';
import { Cpu } from 'lucide-react';
import { ENDPOINTS } from '../api/httpMonitoringApi';
import { RESOURCE_TARGETS } from '../config/services';
import { ResourceCards } from '../components/resources/ResourceCards';
import { ResourceHistoryChart } from '../components/resources/ResourceHistoryChart';
import { GlassCard } from '../components/ui/GlassCard';
import { Skeleton } from '../components/ui/Skeleton';
import { staggerContainer } from '../components/ui/motion';
import type { ResourceSnapshot, ResourceUsage } from '../types/monitoring';

interface ResourcesViewProps {
  resources: ResourceUsage[] | null;
  history: ResourceSnapshot[];
  loading: boolean;
  isDark: boolean;
}

export function ResourcesView({ resources, history, loading, isDark }: ResourcesViewProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {RESOURCE_TARGETS.map((t) => (
          <Skeleton key={t.id} className="h-64 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (!resources) {
    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="show">
        <GlassCard icon={<Cpu className="size-4.5" />} title="Resource usage not reported">
          <div className="text-muted space-y-2 px-6 pb-6 text-sm">
            <p>The backend does not expose CPU and memory metrics yet.</p>
            <p>
              Implement <code className="rounded bg-brand-400/15 px-1.5 py-0.5 font-mono text-xs">GET {ENDPOINTS.resources}</code> returning a
              list such as <code className="font-mono text-xs">{'[{ "service": "payments", "cpuPercent": 42, "memoryPercent": 61 }]'}</code>{' '}
              and this view will light up automatically.
            </p>
          </div>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <ResourceCards resources={resources} />
      <ResourceHistoryChart history={history} isDark={isDark} />
    </motion.div>
  );
}

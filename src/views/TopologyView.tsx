import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Network } from 'lucide-react';
import { buildTopology } from '../utils/topology';
import { GlassCard } from '../components/ui/GlassCard';
import { Skeleton } from '../components/ui/Skeleton';
import { HEALTH_STYLES } from '../components/ui/health';
import { staggerContainer } from '../components/ui/motion';
import { HealthGrid } from '../components/topology/HealthGrid';
import { NodeDetails } from '../components/topology/NodeDetails';
import { TopologyMap } from '../components/topology/TopologyMap';
import type { LogEntry, ResourceUsage, ServiceId, ServiceMetrics } from '../types/monitoring';

interface TopologyViewProps {
  metrics: ServiceMetrics[];
  recentLogs: LogEntry[];
  resources: ResourceUsage[] | null;
  lastUpdated: number | null;
  loading: boolean;
  onOpenLogs: (service: ServiceId) => void;
}

const LEGEND = (['healthy', 'degraded', 'critical', 'idle'] as const).map((h) => HEALTH_STYLES[h]);

export function TopologyView({ metrics, recentLogs, resources, lastUpdated, loading, onOpenLogs }: TopologyViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>('gateway');
  const topology = useMemo(() => buildTopology(metrics, recentLogs, lastUpdated ?? 0), [metrics, recentLogs, lastUpdated]);
  const selected = topology.nodes.find((n) => n.id === selectedId) ?? null;
  const select = (id: string) => setSelectedId((current) => (current === id ? null : id));

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard
          className="xl:col-span-2"
          icon={<Network className="size-4.5" />}
          title="Service map"
          subtitle="Request flow from clients through the gateway; hover or click a node"
          actions={
            <ul className="flex flex-wrap gap-3 text-xs">
              {LEGEND.map((h) => (
                <li key={h.label} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: h.color }} />
                  {h.label}
                </li>
              ))}
            </ul>
          }
          bodyClassName="px-3 pb-4 sm:px-5"
        >
          {loading ? <Skeleton className="h-80" /> : <TopologyMap topology={topology} selectedId={selectedId} onSelect={select} />}
        </GlassCard>

        <GlassCard>
          <NodeDetails node={selected} resources={resources} recentLogs={recentLogs} onOpenLogs={onOpenLogs} />
        </GlassCard>
      </div>

      <GlassCard icon={<LayoutGrid className="size-4.5" />} title="Health status grid" subtitle="Every component, filterable by status">
        {loading ? (
          <Skeleton className="mx-6 mb-6 h-40" />
        ) : (
          <HealthGrid nodes={topology.nodes} selectedId={selectedId} onSelect={select} />
        )}
      </GlassCard>
    </motion.div>
  );
}

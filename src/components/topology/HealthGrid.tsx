import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Database, Monitor } from 'lucide-react';
import { formatMs, formatNumber, formatPercent } from '../../utils/format';
import { HealthBadge } from '../ui/HealthBadge';
import { HEALTH_STYLES } from '../ui/health';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ServiceIcon } from '../ui/ServiceIcon';
import type { Health } from '../../types/monitoring';
import type { TopologyNode } from '../../utils/topology';

type HealthFilter = Health | 'all';

const FILTERS: { value: HealthFilter; label: string; tone?: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'healthy', label: 'Healthy', tone: HEALTH_STYLES.healthy.text },
  { value: 'degraded', label: 'Degraded', tone: HEALTH_STYLES.degraded.text },
  { value: 'critical', label: 'Critical', tone: HEALTH_STYLES.critical.text },
  { value: 'idle', label: 'Idle', tone: HEALTH_STYLES.idle.text },
];

interface HealthGridProps {
  nodes: TopologyNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function NodeGlyph({ node }: { node: TopologyNode }) {
  if (node.kind === 'client') return <Monitor className="size-4.5" aria-hidden />;
  if (node.kind === 'database') return <Database className="size-4.5" aria-hidden />;
  return <ServiceIcon kind={node.resourceTarget ?? 'gateway'} className="size-4.5" />;
}

/** Status grid of every component, filterable by health. */
export function HealthGrid({ nodes, selectedId, onSelect }: HealthGridProps) {
  const [filter, setFilter] = useState<HealthFilter>('all');
  const components = nodes.filter((n) => n.kind !== 'client');
  const visible = filter === 'all' ? components : components.filter((n) => n.health === filter);
  const options = FILTERS.map((f) => ({
    ...f,
    count: f.value === 'all' ? components.length : components.filter((n) => n.health === f.value).length,
  }));

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto px-5 sm:px-6">
        <SegmentedControl label="Filter by health" value={filter} onChange={setFilter} options={options} size="sm" />
      </div>
      <motion.ul layout className="grid gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-6 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((node) => {
            const color = HEALTH_STYLES[node.health].color;
            const selected = node.id === selectedId;
            return (
              <motion.li
                key={node.id}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              >
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  onClick={() => onSelect(node.id)}
                  aria-pressed={selected}
                  className={`w-full rounded-2xl bg-night-900/3 p-4 text-left ring-1 ring-inset transition dark:bg-white/3 ${
                    selected ? 'ring-brand-500/60' : 'ring-night-900/6 hover:ring-brand-500/30 dark:ring-white/6'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-xl" style={{ backgroundColor: `${color}22`, color }}>
                        <NodeGlyph node={node} />
                      </span>
                      <span>
                        <span className="block text-sm font-bold">{node.label}</span>
                        <span className="text-muted block text-[11px] capitalize">{node.kind}</span>
                      </span>
                    </span>
                    <HealthBadge health={node.health} />
                  </div>
                  <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <dt className="text-muted">Latency</dt>
                      <dd className="font-semibold tabular-nums">{formatMs(node.avgLatencyMs)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Errors</dt>
                      <dd className="font-semibold tabular-nums">{formatPercent(node.errorRate)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Rate</dt>
                      <dd className="font-semibold tabular-nums">{formatNumber(node.rpm)} rpm</dd>
                    </div>
                  </dl>
                </motion.button>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {visible.length === 0 && <li className="text-muted col-span-full py-8 text-center text-sm">No components in this state.</li>}
      </motion.ul>
    </div>
  );
}

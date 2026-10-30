import { useState } from 'react';
import { motion } from 'motion/react';
import { Database, Monitor } from 'lucide-react';
import { formatMs, formatNumber } from '../../utils/format';
import { HEALTH_STYLES } from '../ui/health';
import { ServiceIcon } from '../ui/ServiceIcon';
import type { Topology, TopologyEdge, TopologyNode } from '../../utils/topology';

interface TopologyMapProps {
  topology: Topology;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const VIEWBOX = { width: 1000, height: 460 };
const NODE = { width: 168, height: 70 };

const POSITIONS: Record<string, { x: number; y: number }> = {
  clients: { x: 100, y: 230 },
  gateway: { x: 340, y: 230 },
  inventory: { x: 620, y: 85 },
  orders: { x: 620, y: 230 },
  payments: { x: 620, y: 375 },
  'inventory-db': { x: 885, y: 85 },
  'orders-db': { x: 885, y: 230 },
  'payments-db': { x: 885, y: 375 },
};

function edgePath(edge: TopologyEdge): string {
  const a = POSITIONS[edge.from];
  const b = POSITIONS[edge.to];
  const x1 = a.x + NODE.width / 2;
  const x2 = b.x - NODE.width / 2;
  const mid = (x1 + x2) / 2;
  return `M${x1},${a.y} C${mid},${a.y} ${mid},${b.y} ${x2},${b.y}`;
}

/** Faster flow for busier links; no flow at all when there is no traffic. */
function flowDuration(rpm: number): number {
  return Math.max(0.45, 2.4 - Math.log10(rpm + 1));
}

function NodeIcon({ node, x, y }: { node: TopologyNode; x: number; y: number }) {
  const props = { x, y, width: 20, height: 20, strokeWidth: 2 };
  if (node.kind === 'client') return <Monitor {...props} />;
  if (node.kind === 'database') return <Database {...props} />;
  return <ServiceIcon kind={node.resourceTarget ?? 'gateway'} {...props} />;
}

export function TopologyMap({ topology, selectedId, onSelect }: TopologyMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const focusId = hoveredId ?? selectedId;
  const isLinked = (edge: TopologyEdge) => focusId !== null && (edge.from === focusId || edge.to === focusId);

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      className="h-auto w-full select-none"
      role="group"
      aria-label="Service topology"
    >
      {topology.edges.map((edge) => {
        const d = edgePath(edge);
        const color = HEALTH_STYLES[edge.health].color;
        const dimmed = focusId !== null && !isLinked(edge);
        const duration = flowDuration(edge.rpm);
        return (
          <g key={edge.id} style={{ opacity: dimmed ? 0.25 : 1, transition: 'opacity 200ms' }}>
            <path d={d} fill="none" stroke={color} strokeOpacity={0.18} strokeWidth={isLinked(edge) ? 6 : 4} strokeLinecap="round" />
            {edge.rpm > 0 && (
              <>
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray="6 18"
                  strokeLinecap="round"
                  className="animate-flow"
                  style={{ animationDuration: `${duration}s` }}
                />
                {[0, 0.5].map((offset) => (
                  <circle key={offset} r={3.5} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
                    <animateMotion dur={`${duration * 2.2}s`} begin={`${offset * duration * 2.2}s`} repeatCount="indefinite" path={d} />
                  </circle>
                ))}
              </>
            )}
          </g>
        );
      })}

      {topology.nodes.map((node, index) => {
        const pos = POSITIONS[node.id];
        if (!pos) return null;
        const style = HEALTH_STYLES[node.health];
        const selected = node.id === selectedId;
        const x = pos.x - NODE.width / 2;
        const y = pos.y - NODE.height / 2;
        const metric =
          node.kind === 'client'
            ? `${formatNumber(node.rpm)} rpm`
            : node.kind === 'database'
              ? 'status inferred'
              : `${formatMs(node.avgLatencyMs)} · ${formatNumber(node.rpm)} rpm`;

        return (
          <motion.g
            key={node.id}
            role="button"
            tabIndex={0}
            aria-label={`${node.label}: ${style.label}`}
            aria-pressed={selected}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{ cursor: 'pointer', outline: 'none' }}
            onClick={() => onSelect(node.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(node.id);
              }
            }}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(node.id)}
            onBlur={() => setHoveredId(null)}
          >
            {node.health === 'critical' && (
              <rect
                x={x}
                y={y}
                width={NODE.width}
                height={NODE.height}
                rx={18}
                fill="none"
                stroke={style.color}
                strokeWidth={2}
                className="animate-ring-pulse"
              />
            )}
            <rect
              x={x}
              y={y}
              width={NODE.width}
              height={NODE.height}
              rx={18}
              className="fill-white/85 dark:fill-[#1c140d]/90"
              stroke={style.color}
              strokeOpacity={selected ? 1 : 0.55}
              strokeWidth={selected ? 2.5 : 1.5}
              style={{ filter: selected ? `drop-shadow(0 0 12px ${style.color}88)` : undefined }}
            />
            <rect x={x + 12} y={pos.y - 17} width={34} height={34} rx={10} fill={style.color} fillOpacity={0.16} />
            <g className="text-stone-700 dark:text-stone-200" style={{ color: style.color }}>
              <NodeIcon node={node} x={x + 19} y={pos.y - 10} />
            </g>
            <text x={x + 56} y={pos.y - 4} className="fill-stone-900 font-display text-[14px] font-bold dark:fill-stone-100">
              {node.label}
            </text>
            <text x={x + 56} y={pos.y + 14} className="fill-stone-500 text-[11px] dark:fill-stone-400">
              {metric}
            </text>
            <circle cx={x + NODE.width - 14} cy={y + 14} r={4.5} fill={style.color} />
          </motion.g>
        );
      })}
    </svg>
  );
}

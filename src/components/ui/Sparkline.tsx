import { useId } from 'react';
import { motion } from 'motion/react';

interface SparklineProps {
  values: number[];
  color: string;
  height?: number;
  className?: string;
}

const WIDTH = 120;

/** Tiny area chart without axes, for trends inside cards. */
export function Sparkline({ values, color, height = 36, className = '' }: SparklineProps) {
  const gradientId = useId();
  if (values.length < 2) return <div className={className} style={{ height }} />;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = WIDTH / (values.length - 1);
  const points = values.map((v, i) => [i * step, height - 3 - ((v - min) / range) * (height - 6)] as const);
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${WIDTH},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} preserveAspectRatio="none" className={className} style={{ height }} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <motion.path d={area} fill={`url(#${gradientId})`} animate={{ d: area }} transition={{ duration: 0.5 }} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        animate={{ d: line }}
        transition={{ duration: 0.5 }}
      />
    </svg>
  );
}

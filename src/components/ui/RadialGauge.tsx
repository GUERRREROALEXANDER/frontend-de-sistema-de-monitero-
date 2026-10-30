import { motion } from 'motion/react';
import { AnimatedNumber } from './AnimatedNumber';

interface RadialGaugeProps {
  value: number;
  label: string;
  /** Percentage from which the gauge turns amber, then coral. */
  warnAt: number;
  criticalAt?: number;
  size?: number;
  caption?: string;
}

const STROKE = 9;

export function RadialGauge({ value, label, warnAt, criticalAt = 95, size = 112, caption }: RadialGaugeProps) {
  const radius = (size - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, value));
  const color = clamped >= criticalAt ? '#ff3d71' : clamped >= warnAt ? '#fbbf24' : '#2ee6a6';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${label} ${clamped.toFixed(1)}%`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={STROKE} className="stroke-night-300/50 dark:stroke-white/8" />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference * (1 - clamped / 100), stroke: color }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <AnimatedNumber value={clamped} format={(v) => `${v.toFixed(0)}%`} className="font-display text-xl font-bold tabular-nums" />
            <p className="text-muted text-[11px] font-medium uppercase tracking-wider">{label}</p>
          </div>
        </div>
      </div>
      {caption && <p className="text-muted text-xs tabular-nums">{caption}</p>}
    </div>
  );
}

import { motion } from 'motion/react';

interface PulseDotProps {
  color: string;
  pulsing?: boolean;
  /** Faster pulse, used for critical states. */
  fast?: boolean;
  size?: number;
}

/** Status dot with an expanding halo. */
export function PulseDot({ color, pulsing = true, fast = false, size = 8 }: PulseDotProps) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }} aria-hidden>
      {pulsing && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 2.6 }}
          transition={{ duration: fast ? 0.9 : 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <span className="relative inline-flex size-full rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

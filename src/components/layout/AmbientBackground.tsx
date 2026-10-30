import { motion } from 'motion/react';

const BLOBS = [
  { className: 'left-[-10%] top-[-15%] size-[42rem] bg-brand-400/28 dark:bg-brand-500/20', x: [0, 40, 0], y: [0, 30, 0], duration: 22 },
  { className: 'right-[-12%] top-[10%] size-[36rem] bg-pink-400/25 dark:bg-pink-500/18', x: [0, -50, 0], y: [0, 40, 0], duration: 26 },
  { className: 'bottom-[-20%] left-[25%] size-[40rem] bg-violet-400/25 dark:bg-violet-600/22', x: [0, 30, 0], y: [0, -30, 0], duration: 30 },
  { className: 'bottom-[5%] right-[10%] size-[24rem] bg-cyan-300/20 dark:bg-cyan-500/10', x: [0, -20, 0], y: [0, -20, 0], duration: 24 },
];

/** Slow-moving glow behind the glass surfaces. */
export function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      {BLOBS.map((blob, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          animate={{ x: blob.x, y: blob.y }}
          transition={{ duration: blob.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(rgb(91_33_182/0.07)_1px,transparent_1px)] bg-size-[22px_22px] dark:bg-[radial-gradient(rgb(236_233_251/0.05)_1px,transparent_1px)]" />
    </div>
  );
}

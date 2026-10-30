import { motion } from 'motion/react';
import { RefreshCw, WifiOff } from 'lucide-react';

interface ConnectionErrorProps {
  message: string;
  onRetry: () => void;
  /** `banner` when data is already on screen; `full` when the first load failed. */
  variant: 'banner' | 'full';
}

export function ConnectionError({ message, onRetry, variant }: ConnectionErrorProps) {
  if (variant === 'banner') {
    return (
      <motion.div
        role="alert"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-amber-400/12 px-4 py-3 text-sm text-amber-900 ring-1 ring-inset ring-amber-500/35 backdrop-blur-md dark:text-amber-100"
      >
        <WifiOff className="size-4 shrink-0" aria-hidden />
        <span className="flex-1">
          <strong className="font-bold">Unstable connection.</strong> {message} Showing the last data received; retrying automatically.
        </span>
        <button type="button" onClick={onRetry} className="font-bold underline-offset-2 hover:underline">
          Retry now
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass flex flex-col items-center gap-4 rounded-3xl px-6 py-16 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="grid size-16 place-items-center rounded-3xl bg-danger-500/15 text-danger-500"
      >
        <WifiOff className="size-8" aria-hidden />
      </motion.div>
      <div>
        <h2 className="text-xl font-extrabold">Can’t reach the monitoring backend</h2>
        <p className="text-muted mt-1 max-w-md text-sm">{message}</p>
        <p className="text-muted mt-1 text-xs">Retrying every few seconds.</p>
      </div>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-brand-400 via-pink-500 to-violet-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-pink-500/30"
      >
        <RefreshCw className="size-4" aria-hidden />
        Retry
      </motion.button>
    </motion.div>
  );
}

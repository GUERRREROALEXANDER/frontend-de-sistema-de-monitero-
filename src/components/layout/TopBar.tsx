import { motion } from 'motion/react';
import { Loader2, Moon, RefreshCw, Sun, Zap } from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import { formatRelative } from '../../utils/format';
import { PulseDot } from '../ui/PulseDot';
import type { Theme } from '../../hooks/useTheme';

interface TopBarProps {
  title: string;
  description: string;
  theme: Theme;
  onToggleTheme: () => void;
  onSimulateLoad: () => void;
  onRefresh: () => void;
  isSimulating: boolean;
  isFetching: boolean;
  connected: boolean;
  lastUpdated: number | null;
  mockMode: boolean;
}

export function TopBar(props: TopBarProps) {
  const { title, description, theme, onToggleTheme, onSimulateLoad, onRefresh, isSimulating, isFetching, connected, lastUpdated, mockMode } =
    props;
  const now = useNow();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-6">
      <div>
        <motion.h1
          key={title}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-extrabold tracking-tight sm:text-3xl"
        >
          {title}
        </motion.h1>
        <p className="text-muted mt-1 text-sm">{description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {mockMode && (
          <span className="rounded-full bg-brand-400/15 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-500/30 dark:text-brand-300">
            Demo data
          </span>
        )}

        <span className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" aria-live="polite">
          <PulseDot color={connected ? '#10b981' : '#ef4444'} fast={!connected} />
          {connected ? 'Live' : 'Offline'}
          {lastUpdated !== null && <span className="text-muted hidden font-normal sm:inline">· {formatRelative(lastUpdated, now)}</span>}
        </span>

        <motion.button
          type="button"
          onClick={onRefresh}
          whileTap={{ scale: 0.9 }}
          className="glass grid size-9 place-items-center rounded-xl transition hover:text-brand-600 dark:hover:text-brand-300"
          aria-label="Refresh now"
          title="Refresh now"
        >
          <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
        </motion.button>

        <motion.button
          type="button"
          onClick={onToggleTheme}
          whileTap={{ scale: 0.9, rotate: -20 }}
          className="glass grid size-9 place-items-center rounded-xl transition hover:text-brand-600 dark:hover:text-brand-300"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </motion.button>

        <motion.button
          type="button"
          onClick={onSimulateLoad}
          disabled={isSimulating}
          whileHover={{ y: -1, boxShadow: '0 12px 28px -8px rgb(59 130 246 / 0.55)' }}
          whileTap={{ scale: 0.97 }}
          className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-brand-500 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/30 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {/* Light sweep on hover */}
          <span
            className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/35 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[400%]"
            aria-hidden
          />
          {isSimulating ? <Loader2 className="relative size-4 animate-spin" aria-hidden /> : <Zap className="relative size-4" aria-hidden />}
          <span className="relative">{isSimulating ? 'Simulating…' : 'Simulate Load'}</span>
        </motion.button>
      </div>
    </header>
  );
}

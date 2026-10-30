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
          <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/30 dark:text-amber-300">
            Demo data
          </span>
        )}

        <span className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold" aria-live="polite">
          <PulseDot color={connected ? '#10b981' : '#ff5a3c'} fast={!connected} />
          {connected ? 'Live' : 'Offline'}
          {lastUpdated !== null && <span className="text-muted hidden font-normal sm:inline">· {formatRelative(lastUpdated, now)}</span>}
        </span>

        <motion.button
          type="button"
          onClick={onRefresh}
          whileTap={{ scale: 0.9 }}
          className="glass grid size-9 place-items-center rounded-xl transition hover:text-amber-600 dark:hover:text-amber-300"
          aria-label="Refresh now"
          title="Refresh now"
        >
          <RefreshCw className={`size-4 ${isFetching ? 'animate-spin' : ''}`} />
        </motion.button>

        <motion.button
          type="button"
          onClick={onToggleTheme}
          whileTap={{ scale: 0.9, rotate: -20 }}
          className="glass grid size-9 place-items-center rounded-xl transition hover:text-amber-600 dark:hover:text-amber-300"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </motion.button>

        <motion.button
          type="button"
          onClick={onSimulateLoad}
          disabled={isSimulating}
          whileHover={{ y: -1, boxShadow: '0 12px 28px -8px rgb(255 90 60 / 0.55)' }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-amber-400 via-orange-500 to-coral-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-coral-500/30 disabled:cursor-not-allowed disabled:opacity-75"
        >
          {isSimulating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Zap className="size-4" aria-hidden />}
          {isSimulating ? 'Simulating…' : 'Simulate Load'}
        </motion.button>
      </div>
    </header>
  );
}

import { motion } from 'motion/react';
import { Loader2, ScrollText } from 'lucide-react';
import { env } from '../config/env';
import { LogsFilters } from '../components/logs/LogsFilters';
import { LogsTable } from '../components/logs/LogsTable';
import { GlassCard } from '../components/ui/GlassCard';
import { staggerContainer } from '../components/ui/motion';
import type { LogEntry, LogFilters } from '../types/monitoring';

interface LogsViewProps {
  logs: LogEntry[];
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
  loading: boolean;
  isFetching: boolean;
}

export function LogsView({ logs, filters, onFiltersChange, loading, isFetching }: LogsViewProps) {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show">
      <GlassCard
        icon={<ScrollText className="size-4.5" />}
        title="Real-time logs"
        subtitle={`Auto-refresh every ${env.pollingIntervalMs / 1000}s · click a row to inspect input and response`}
        actions={
          <span
            className={`text-muted inline-flex items-center gap-1.5 text-xs transition-opacity ${isFetching ? 'opacity-100' : 'opacity-0'}`}
            aria-hidden={!isFetching}
          >
            <Loader2 className="size-3.5 animate-spin" />
            Updating
          </span>
        }
      >
        <LogsFilters value={filters} onChange={onFiltersChange} />
        <LogsTable logs={logs} loading={loading} />
      </GlassCard>
    </motion.div>
  );
}

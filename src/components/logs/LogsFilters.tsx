import { motion } from 'motion/react';
import { FilterX } from 'lucide-react';
import { SERVICES } from '../../config/services';
import { DEFAULT_FILTERS, hasActiveFilters } from '../../utils/filterLogs';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { CallStatus, LogFilters, ServiceId } from '../../types/monitoring';

interface LogsFiltersProps {
  value: LogFilters;
  onChange: (value: LogFilters) => void;
}

const fieldClass =
  'h-9 w-full rounded-xl border-0 bg-stone-900/5 px-3 text-sm ring-1 ring-inset ring-stone-900/8 transition focus:outline-none focus:ring-2 focus:ring-amber-500/60 dark:bg-white/5 dark:ring-white/8 dark:[color-scheme:dark]';

const labelClass = 'text-muted mb-1 block text-[11px] font-semibold uppercase tracking-wider';

export function LogsFilters({ value, onChange }: LogsFiltersProps) {
  const set = <K extends keyof LogFilters>(key: K, v: LogFilters[K]) => onChange({ ...value, [key]: v });
  const rangeInvalid = value.from !== '' && value.to !== '' && value.from > value.to;
  const active = hasActiveFilters(value);

  return (
    <div className="grid gap-3 px-5 pb-4 pt-2 sm:grid-cols-2 sm:px-6 lg:grid-cols-[minmax(10rem,1fr)_auto_1fr_1fr_auto] lg:items-end">
      <div>
        <label htmlFor="filter-service" className={labelClass}>
          Service
        </label>
        <select
          id="filter-service"
          className={fieldClass}
          value={value.service}
          onChange={(e) => set('service', e.target.value as ServiceId | 'ALL')}
        >
          <option value="ALL">All services</option>
          {SERVICES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>Status</span>
        <SegmentedControl<CallStatus | 'ALL'>
          label="Status"
          value={value.status}
          onChange={(v) => set('status', v)}
          options={[
            { value: 'ALL', label: 'All' },
            { value: 'SUCCESS', label: 'Success', tone: 'text-emerald-600 dark:text-emerald-400' },
            { value: 'ERROR', label: 'Error', tone: 'text-coral-600 dark:text-coral-400' },
          ]}
        />
      </div>

      <div>
        <label htmlFor="filter-from" className={labelClass}>
          From
        </label>
        <input
          id="filter-from"
          type="datetime-local"
          className={fieldClass}
          value={value.from}
          max={value.to || undefined}
          onChange={(e) => set('from', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="filter-to" className={labelClass}>
          To
        </label>
        <input
          id="filter-to"
          type="datetime-local"
          className={`${fieldClass} ${rangeInvalid ? 'ring-2 ring-coral-500/70' : ''}`}
          value={value.to}
          min={value.from || undefined}
          onChange={(e) => set('to', e.target.value)}
          aria-invalid={rangeInvalid}
        />
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={() => onChange(DEFAULT_FILTERS)}
        disabled={!active}
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/30 transition hover:bg-amber-400/10 disabled:cursor-not-allowed disabled:opacity-35 dark:text-amber-300"
      >
        <FilterX className="size-4" aria-hidden />
        Clear
      </motion.button>

      {rangeInvalid && (
        <p className="text-xs font-semibold text-coral-600 sm:col-span-2 lg:col-span-5 dark:text-coral-400">
          “From” must be earlier than “To”.
        </p>
      )}
    </div>
  );
}

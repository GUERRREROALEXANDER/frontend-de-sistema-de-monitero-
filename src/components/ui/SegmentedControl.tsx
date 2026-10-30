import { useId } from 'react';
import { motion } from 'motion/react';
import { spring } from './motion';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  /** Optional counter shown next to the label */
  count?: number;
  tone?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
}

/** Radio group with a sliding highlight behind the selected option. */
export function SegmentedControl<T extends string>({ options, value, onChange, label, size = 'md' }: SegmentedControlProps<T>) {
  const layoutId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex rounded-xl bg-night-900/5 p-1 ring-1 ring-inset ring-night-900/5 dark:bg-white/5 dark:ring-white/5 ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`relative rounded-lg font-semibold transition-colors ${size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'} ${
              selected ? (opt.tone ?? 'text-night-900 dark:text-white') : 'text-muted hover:text-night-800 dark:hover:text-night-200'
            }`}
          >
            {selected && (
              <motion.span
                layoutId={layoutId}
                transition={spring}
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-white/10"
              />
            )}
            <span className="relative flex items-center gap-1.5 whitespace-nowrap">
              {opt.label}
              {opt.count !== undefined && <span className="text-[10px] tabular-nums opacity-70">{opt.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

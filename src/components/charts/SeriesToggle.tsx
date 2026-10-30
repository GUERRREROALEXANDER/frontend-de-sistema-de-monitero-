import { motion } from 'motion/react';

interface Series {
  id: string;
  label: string;
  color: string;
}

interface SeriesToggleProps {
  series: readonly Series[];
  hidden: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

/** Interactive legend: each chip shows or hides its series. */
export function SeriesToggle({ series, hidden, onToggle }: SeriesToggleProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show or hide series">
      {series.map((s) => {
        const off = hidden.has(s.id);
        return (
          <motion.button
            key={s.id}
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={() => onToggle(s.id)}
            aria-pressed={!off}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset transition ${
              off ? 'text-muted ring-stone-900/10 line-through opacity-60 dark:ring-white/10' : 'ring-stone-900/10 dark:ring-white/10'
            }`}
          >
            <span
              className="size-2.5 rounded-full transition"
              style={{ backgroundColor: off ? 'transparent' : s.color, boxShadow: `inset 0 0 0 2px ${s.color}` }}
            />
            {s.label}
          </motion.button>
        );
      })}
    </div>
  );
}

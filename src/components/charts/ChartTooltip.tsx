import type { ReactNode } from 'react';

export interface TooltipRow {
  key: string;
  color: string;
  label: string;
  detail?: string;
  value: string;
  danger?: boolean;
}

/** Shared glass tooltip used by every Recharts chart. */
export function ChartTooltipBox({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: ReactNode }) {
  if (rows.length === 0) return null;
  return (
    <div className="glass-strong min-w-56 rounded-2xl p-3 text-xs shadow-2xl">
      <p className="text-muted mb-2 font-semibold">{title}</p>
      <ul className="space-y-1.5">
        {rows.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
            <span className="font-semibold">{row.label}</span>
            {row.detail && <span className="text-muted truncate font-mono text-[11px]">{row.detail}</span>}
            <span className={`ml-auto pl-3 font-bold tabular-nums ${row.danger ? 'text-coral-500' : ''}`}>{row.value}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="text-muted mt-2 border-t border-stone-900/5 pt-2 dark:border-white/5">{footer}</div>}
    </div>
  );
}

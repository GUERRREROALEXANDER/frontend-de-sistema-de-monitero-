import { CheckCircle2, XCircle } from 'lucide-react';
import type { CallStatus } from '../../types/monitoring';

export function StatusBadge({ status }: { status: CallStatus }) {
  const ok = status === 'SUCCESS';
  const Icon = ok ? CheckCircle2 : XCircle;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        ok
          ? 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300'
          : 'bg-danger-500/12 text-danger-700 ring-danger-500/35 dark:text-danger-300'
      }`}
    >
      <Icon className="size-3.5" aria-hidden />
      {status}
    </span>
  );
}

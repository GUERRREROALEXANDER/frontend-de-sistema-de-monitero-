import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { SERVICE_BY_ID } from '../../config/services';
import { formatDateTime, formatMs, toPrettyJson } from '../../utils/format';
import type { LogEntry } from '../../types/monitoring';

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied: nothing to do.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="text-muted inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition hover:bg-night-900/5 hover:text-brand-700 dark:hover:bg-white/5 dark:hover:text-brand-300"
      aria-label={label}
    >
      {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function JsonPanel({ title, value, tone }: { title: string; value: unknown; tone: 'neutral' | 'error' }) {
  const json = toPrettyJson(value);
  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-night-950/[0.03] ring-1 ring-inset ring-night-900/8 dark:bg-black/30 dark:ring-white/8">
      <div className="flex items-center justify-between border-b border-night-900/5 px-3 py-1.5 dark:border-white/5">
        <h4 className={`text-[11px] font-bold uppercase tracking-wider ${tone === 'error' ? 'text-danger-500' : 'text-muted'}`}>{title}</h4>
        <CopyButton text={json} label={`Copy ${title.toLowerCase()}`} />
      </div>
      <pre className="max-h-72 overflow-auto p-3 font-mono text-xs leading-relaxed text-night-700 dark:text-night-100/90">{json}</pre>
    </div>
  );
}

export function LogDetail({ log }: { log: LogEntry }) {
  const isError = log.status === 'ERROR';
  const meta = [
    { label: 'Request ID', value: log.requestId, mono: true },
    { label: 'Service', value: SERVICE_BY_ID[log.service].label },
    { label: 'Operation', value: log.operation, mono: true },
    { label: 'Duration', value: formatMs(log.durationMs) },
    { label: 'Timestamp', value: formatDateTime(log.timestamp) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="space-y-4 bg-brand-500/[0.05] px-5 py-4 sm:px-6">
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-5">
          {meta.map((m) => (
            <div key={m.label} className="min-w-0">
              <dt className="text-muted text-[11px] font-semibold uppercase tracking-wider">{m.label}</dt>
              <dd className={`truncate font-semibold ${m.mono ? 'font-mono text-xs leading-5' : ''}`} title={m.value}>
                {m.value}
              </dd>
            </div>
          ))}
        </dl>

        {isError && log.errorMessage && (
          <p className="rounded-xl bg-danger-500/10 px-3 py-2 text-sm font-medium text-danger-700 ring-1 ring-inset ring-danger-500/25 dark:text-danger-300">
            {log.errorMessage}
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <JsonPanel title="Input parameters" value={log.input} tone="neutral" />
          <JsonPanel title="Response" value={log.response} tone={isError ? 'error' : 'neutral'} />
        </div>
      </div>
    </motion.div>
  );
}

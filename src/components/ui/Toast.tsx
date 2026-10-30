import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, X, XCircle } from 'lucide-react';

export interface ToastMessage {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  durationMs?: number;
}

export function Toast({ toast, onClose, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(onClose, durationMs);
    return () => clearTimeout(id);
  }, [toast, onClose, durationMs]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="glass-strong pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-2xl"
          >
            {toast.kind === 'success' ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-500" aria-hidden />
            ) : (
              <XCircle className="size-5 shrink-0 text-danger-500" aria-hidden />
            )}
            <span>{toast.text}</span>
            <button
              type="button"
              onClick={onClose}
              className="text-muted ml-2 rounded-md p-1 transition hover:bg-night-900/5 dark:hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

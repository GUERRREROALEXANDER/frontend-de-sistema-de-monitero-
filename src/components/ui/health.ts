import type { Health } from '../../types/monitoring';

interface HealthStyle {
  label: string;
  /** Hex color for SVG strokes and charts */
  color: string;
  badge: string;
  text: string;
}

export const HEALTH_STYLES: Record<Health, HealthStyle> = {
  healthy: {
    label: 'Healthy',
    color: '#10b981',
    badge: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  degraded: {
    label: 'Degraded',
    color: '#f59e0b',
    badge: 'bg-amber-400/15 text-amber-700 ring-amber-500/35 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400',
  },
  critical: {
    label: 'Critical',
    color: '#ff5a3c',
    badge: 'bg-coral-500/15 text-coral-700 ring-coral-500/40 dark:text-coral-300',
    text: 'text-coral-600 dark:text-coral-400',
  },
  idle: {
    label: 'Idle',
    color: '#a8a29e',
    badge: 'bg-stone-400/15 text-stone-600 ring-stone-400/30 dark:text-stone-300',
    text: 'text-stone-500 dark:text-stone-400',
  },
};

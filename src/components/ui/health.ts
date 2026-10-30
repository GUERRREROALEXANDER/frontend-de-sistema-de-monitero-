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
    color: '#2ee6a6',
    badge: 'bg-emerald-500/12 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  degraded: {
    label: 'Degraded',
    color: '#fbbf24',
    badge: 'bg-amber-400/15 text-amber-700 ring-amber-500/35 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400',
  },
  critical: {
    label: 'Critical',
    color: '#ff3d71',
    badge: 'bg-danger-500/15 text-danger-700 ring-danger-500/40 dark:text-danger-300',
    text: 'text-danger-600 dark:text-danger-400',
  },
  idle: {
    label: 'Idle',
    color: '#9b95c2',
    badge: 'bg-night-400/15 text-night-600 ring-night-400/30 dark:text-night-300',
    text: 'text-night-500 dark:text-night-400',
  },
};

import { PulseDot } from './PulseDot';
import { HEALTH_STYLES } from './health';
import type { Health } from '../../types/monitoring';

export function HealthBadge({ health, className = '' }: { health: Health; className?: string }) {
  const style = HEALTH_STYLES[health];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.badge} ${className}`}
    >
      <PulseDot color={style.color} pulsing={health === 'critical' || health === 'healthy'} fast={health === 'critical'} />
      {style.label}
    </span>
  );
}

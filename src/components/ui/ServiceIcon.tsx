import { CreditCard, Database, Package, ShoppingCart, Waypoints, type LucideProps } from 'lucide-react';
import type { ResourceTarget } from '../../types/monitoring';

const ICONS = {
  gateway: Waypoints,
  inventory: Package,
  orders: ShoppingCart,
  payments: CreditCard,
  database: Database,
} as const;

export type IconKind = ResourceTarget | 'database';

export function ServiceIcon({ kind, ...props }: { kind: IconKind } & LucideProps) {
  const Icon = ICONS[kind];
  return <Icon aria-hidden {...props} />;
}

import { Cpu, LayoutDashboard, Network, ScrollText, type LucideIcon } from 'lucide-react';

export const VIEWS = ['overview', 'topology', 'resources', 'logs'] as const;

export type ViewId = (typeof VIEWS)[number];

export interface NavItem {
  id: ViewId;
  label: string;
  description: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'overview', label: 'Overview', description: 'Live health of every microservice', icon: LayoutDashboard },
  { id: 'topology', label: 'Topology', description: 'Gateway, services and databases', icon: Network },
  { id: 'resources', label: 'Resources', description: 'CPU and memory usage', icon: Cpu },
  { id: 'logs', label: 'Logs', description: 'Every intercepted call, in real time', icon: ScrollText },
];

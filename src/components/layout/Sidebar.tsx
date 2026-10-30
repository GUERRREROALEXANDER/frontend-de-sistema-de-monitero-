import { motion } from 'motion/react';
import { Activity } from 'lucide-react';
import { spring } from '../ui/motion';
import { NAV_ITEMS, type ViewId } from './navigation';

interface SidebarProps {
  active: ViewId;
  onNavigate: (view: ViewId) => void;
  activeAlerts: number;
}

function AlertCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.6 }}
      animate={{ scale: 1 }}
      transition={spring}
      className="grid min-w-5 place-items-center rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white shadow-md shadow-coral-500/40"
    >
      {count}
    </motion.span>
  );
}

export function Sidebar({ active, onNavigate, activeAlerts }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="glass-strong fixed inset-y-3 left-3 z-40 hidden w-60 flex-col rounded-3xl p-4 lg:flex">
        <div className="flex items-center gap-3 px-2 pb-6 pt-1">
          <div className="grid size-10 place-items-center rounded-2xl bg-linear-to-br from-amber-400 to-coral-500 text-white shadow-lg shadow-coral-500/30">
            <Activity className="size-5" aria-hidden />
          </div>
          <div>
            <p className="font-display text-lg font-extrabold leading-none tracking-tight">Pulse</p>
            <p className="text-muted mt-1 text-xs">Microservices monitor</p>
          </div>
        </div>

        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const selected = item.id === active;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={selected ? 'page' : undefined}
                className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  selected ? 'text-stone-900 dark:text-white' : 'text-muted hover:text-stone-900 dark:hover:text-stone-100'
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="sidebar-active"
                    transition={spring}
                    className="absolute inset-0 rounded-2xl bg-linear-to-r from-amber-400/25 to-coral-500/10 ring-1 ring-inset ring-amber-500/25"
                  />
                )}
                <Icon className={`relative size-4.5 transition-transform group-hover:scale-110 ${selected ? 'text-amber-500' : ''}`} />
                <span className="relative flex-1 text-left">{item.label}</span>
                {item.id === 'overview' && (
                  <span className="relative">
                    <AlertCount count={activeAlerts} />
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl bg-linear-to-br from-amber-400/15 to-coral-500/10 p-4 text-xs ring-1 ring-inset ring-amber-500/15">
          <p className="font-semibold text-amber-700 dark:text-amber-300">Proxy pattern</p>
          <p className="text-muted mt-1 leading-relaxed">Every call to Inventory, Orders and Payments is intercepted and measured.</p>
        </div>
      </aside>

      {/* Mobile */}
      <nav
        aria-label="Main"
        className="glass-strong fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-2xl p-1.5 lg:hidden"
      >
        {NAV_ITEMS.map((item) => {
          const selected = item.id === active;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={selected ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold ${
                selected ? 'text-amber-600 dark:text-amber-300' : 'text-muted'
              }`}
            >
              {selected && (
                <motion.span layoutId="mobile-active" transition={spring} className="absolute inset-0 rounded-xl bg-amber-400/15" />
              )}
              <Icon className="relative size-5" />
              <span className="relative">{item.label}</span>
              {item.id === 'overview' && activeAlerts > 0 && (
                <span className="absolute right-[22%] top-1 size-2 rounded-full bg-coral-500" aria-label={`${activeAlerts} active alerts`} />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}

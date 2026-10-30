import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { fadeUp } from './motion';

interface GlassCardProps {
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Translucent card with an optional header; animates in when its parent staggers. */
export function GlassCard({ title, subtitle, icon, actions, className = '', bodyClassName = '', children }: GlassCardProps) {
  return (
    <motion.section variants={fadeUp} className={`glass overflow-hidden rounded-3xl ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pb-2 pt-5 sm:px-6">
          <div className="flex items-start gap-3">
            {icon && (
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-400/15 text-brand-600 dark:text-brand-300">
                {icon}
              </span>
            )}
            <div>
              {title && <h2 className="text-base font-bold tracking-tight">{title}</h2>}
              {subtitle && <p className="text-muted mt-0.5 text-sm">{subtitle}</p>}
            </div>
          </div>
          {actions}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </motion.section>
  );
}

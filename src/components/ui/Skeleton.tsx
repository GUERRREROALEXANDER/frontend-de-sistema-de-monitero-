export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-night-300/40 dark:bg-white/5 ${className}`} />;
}

import { useCallback, useEffect, useState } from 'react';

/**
 * Keeps the active view in the URL hash (`#/logs`), so views can be bookmarked and
 * the browser back button works without a router dependency.
 */
export function useHashView<T extends string>(views: readonly T[], fallback: T): [T, (view: T) => void] {
  const read = useCallback((): T => {
    const value = window.location.hash.replace(/^#\/?/, '') as T;
    return views.includes(value) ? value : fallback;
  }, [views, fallback]);

  const [view, setView] = useState<T>(read);

  useEffect(() => {
    const onHashChange = () => setView(read());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [read]);

  const navigate = useCallback((next: T) => {
    window.location.hash = `/${next}`;
  }, []);

  return [view, navigate];
}

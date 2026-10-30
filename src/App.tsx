import { useCallback, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { describeError, monitoringApi } from './api';
import { env } from './config/env';
import { useDashboardData } from './hooks/useDashboardData';
import { useHashView } from './hooks/useHashView';
import { useTheme } from './hooks/useTheme';
import { DEFAULT_FILTERS } from './utils/filterLogs';
import { AmbientBackground } from './components/layout/AmbientBackground';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { NAV_ITEMS, VIEWS } from './components/layout/navigation';
import { ConnectionError } from './components/feedback/ConnectionError';
import { Toast, type ToastMessage } from './components/ui/Toast';
import { pageTransition } from './components/ui/motion';
import { OverviewView } from './views/OverviewView';
import { TopologyView } from './views/TopologyView';
import { ResourcesView } from './views/ResourcesView';
import { LogsView } from './views/LogsView';
import type { LogFilters, ServiceId } from './types/monitoring';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [view, navigate] = useHashView(VIEWS, 'overview');
  const [filters, setFilters] = useState<LogFilters>(DEFAULT_FILTERS);
  const [isSimulating, setIsSimulating] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const data = useDashboardData(filters);
  const { refresh } = data;
  const loading = data.status === 'loading';
  const isDark = theme === 'dark';
  const activeAlerts = data.alerts.filter((a) => a.resolvedAt === null).length;
  const nav = NAV_ITEMS.find((item) => item.id === view) ?? NAV_ITEMS[0];

  const handleSimulateLoad = useCallback(async () => {
    setIsSimulating(true);
    try {
      const result = await monitoringApi.simulateLoad();
      await refresh();
      setToast({ id: Date.now(), kind: 'success', text: result.message });
    } catch (error) {
      setToast({ id: Date.now(), kind: 'error', text: `Load simulation failed: ${describeError(error)}` });
    } finally {
      setIsSimulating(false);
    }
  }, [refresh]);

  const openLogs = useCallback(
    (service: ServiceId) => {
      setFilters({ ...DEFAULT_FILTERS, service });
      navigate('logs');
    },
    [navigate],
  );

  const closeToast = useCallback(() => setToast(null), []);

  const renderView = () => {
    switch (view) {
      case 'topology':
        return (
          <TopologyView
            metrics={data.metrics}
            recentLogs={data.recentLogs}
            resources={data.resources}
            lastUpdated={data.lastUpdated}
            loading={loading}
            onOpenLogs={openLogs}
          />
        );
      case 'resources':
        return <ResourcesView resources={data.resources} history={data.resourceHistory} loading={loading} isDark={isDark} />;
      case 'logs':
        return (
          <LogsView
            logs={data.tableLogs}
            filters={filters}
            onFiltersChange={setFilters}
            loading={loading}
            isFetching={data.isFetching}
          />
        );
      default:
        return (
          <OverviewView
            metrics={data.metrics}
            recentLogs={data.recentLogs}
            alerts={data.alerts}
            lastUpdated={data.lastUpdated}
            loading={loading}
            isDark={isDark}
            onOpenLogs={openLogs}
          />
        );
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <AmbientBackground />
      <Sidebar active={view} onNavigate={navigate} activeAlerts={activeAlerts} />

      <div className="min-h-dvh px-4 pb-28 pt-6 sm:px-6 lg:pb-10 lg:pl-[17.5rem] lg:pr-8">
        <div className="mx-auto max-w-[96rem]">
          <TopBar
            title={nav.label}
            description={nav.description}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSimulateLoad={() => void handleSimulateLoad()}
            onRefresh={() => void refresh()}
            isSimulating={isSimulating}
            isFetching={data.isFetching}
            connected={data.status === 'ready' && data.error === null}
            lastUpdated={data.lastUpdated}
            mockMode={env.useMock}
          />

          <AnimatePresence>
            {data.error && data.status !== 'error' && (
              <ConnectionError variant="banner" message={data.error} onRetry={() => void refresh()} />
            )}
          </AnimatePresence>

          <main>
            {data.status === 'error' ? (
              <ConnectionError variant="full" message={data.error ?? ''} onRetry={() => void refresh()} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={view} variants={pageTransition} initial="initial" animate="enter" exit="exit">
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            )}
          </main>

          <footer className="text-muted mt-10 text-center text-xs">
            Backend: <span className="font-mono">{env.useMock ? 'demo mode' : env.apiBaseUrl}</span>
          </footer>
        </div>
      </div>

      <Toast toast={toast} onClose={closeToast} />
    </MotionConfig>
  );
}

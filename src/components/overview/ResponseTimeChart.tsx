import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Timer } from 'lucide-react';
import { CHART_WINDOW, SERVICES } from '../../config/services';
import { buildChartRows, type ChartRow } from '../../utils/chartData';
import { formatMs, formatTime } from '../../utils/format';
import { ChartTooltipBox } from '../charts/ChartTooltip';
import { SeriesToggle } from '../charts/SeriesToggle';
import { toggleInSet } from '../../utils/sets';
import { getChartTheme } from '../charts/chartTheme';
import { GlassCard } from '../ui/GlassCard';
import { Skeleton } from '../ui/Skeleton';
import type { LogEntry, ServiceId } from '../../types/monitoring';

interface ResponseTimeChartProps {
  logs: LogEntry[];
  loading: boolean;
  isDark: boolean;
}

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: ChartRow;
}

/** Series point: larger and red when the call ended in ERROR. */
function makeDot(service: ServiceId, color: string, surface: string) {
  return function ServiceDot(props: unknown) {
    const { cx, cy, index, payload } = props as DotProps;
    const key = `${service}-${index}`;
    if (cx === undefined || cy === undefined || !payload?.logs[service]) return <g key={key} />;
    const isError = payload.logs[service]?.status === 'ERROR';
    return (
      <circle
        key={key}
        cx={cx}
        cy={cy}
        r={isError ? 5.5 : 3}
        fill={isError ? '#ef4444' : color}
        stroke={surface}
        strokeWidth={isError ? 2 : 1}
      />
    );
  };
}

export function ResponseTimeChart({ logs, loading, isDark }: ResponseTimeChartProps) {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const rows = useMemo(() => buildChartRows(logs), [logs]);
  const theme = getChartTheme(isDark);

  return (
    <GlassCard
      icon={<Timer className="size-4.5" />}
      title="Response time per call"
      subtitle={`Last ${CHART_WINDOW} calls per service · red points are errors`}
      actions={<SeriesToggle series={SERVICES} hidden={hidden} onToggle={(id) => setHidden((h) => toggleInSet(h, id))} />}
    >
      <div className="h-72 px-2 pb-4 sm:px-4">
        {loading ? (
          <Skeleton className="size-full" />
        ) : rows.length === 0 ? (
          <div className="text-muted grid size-full place-items-center text-sm">No calls recorded yet. Try “Simulate Load”.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis
                dataKey="call"
                tick={{ fill: theme.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Call #', position: 'insideBottomRight', offset: -2, fill: theme.axis, fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: theme.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={44}
                label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: theme.axis, fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: theme.cursor, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as ChartRow | undefined;
                  if (!active || !row) return null;
                  const first = SERVICES.map((s) => row.logs[s.id]).find((log) => log !== undefined);
                  return (
                    <ChartTooltipBox
                      title={`Call #${row.call}`}
                      footer={first ? formatTime(first.timestamp) : undefined}
                      rows={SERVICES.filter((s) => !hidden.has(s.id) && row.logs[s.id]).map((s) => {
                        const log = row.logs[s.id] as LogEntry;
                        return {
                          key: s.id,
                          color: s.color,
                          label: s.label,
                          detail: log.operation,
                          value: formatMs(log.durationMs),
                          danger: log.status === 'ERROR',
                        };
                      })}
                    />
                  );
                }}
              />
              {SERVICES.map((s) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.id}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2.5}
                  hide={hidden.has(s.id)}
                  dot={makeDot(s.id, s.color, theme.surface)}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}

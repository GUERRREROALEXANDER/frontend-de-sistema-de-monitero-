import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LineChart as LineChartIcon } from 'lucide-react';
import { RESOURCE_TARGETS, THRESHOLDS } from '../../config/services';
import { formatPercent, formatTime } from '../../utils/format';
import { ChartTooltipBox } from '../charts/ChartTooltip';
import { SeriesToggle } from '../charts/SeriesToggle';
import { toggleInSet } from '../../utils/sets';
import { getChartTheme } from '../charts/chartTheme';
import { GlassCard } from '../ui/GlassCard';
import { SegmentedControl } from '../ui/SegmentedControl';
import type { ResourceSnapshot } from '../../types/monitoring';

type Metric = 'cpu' | 'memory';

type Row = { time: number } & Record<string, number>;

export function ResourceHistoryChart({ history, isDark }: { history: ResourceSnapshot[]; isDark: boolean }) {
  const [metric, setMetric] = useState<Metric>('cpu');
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const theme = getChartTheme(isDark);

  const rows = useMemo<Row[]>(
    () =>
      history.map((snapshot) => {
        const row: Row = { time: snapshot.timestamp };
        for (const u of snapshot.usage) row[u.target] = metric === 'cpu' ? u.cpuPercent : u.memoryPercent;
        return row;
      }),
    [history, metric],
  );

  const threshold = metric === 'cpu' ? THRESHOLDS.cpuWarning : THRESHOLDS.memoryWarning;

  return (
    <GlassCard
      icon={<LineChartIcon className="size-4.5" />}
      title="Usage history"
      subtitle={`One sample per refresh · dashed line is the ${threshold}% warning threshold`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SeriesToggle series={RESOURCE_TARGETS} hidden={hidden} onToggle={(id) => setHidden((h) => toggleInSet(h, id))} />
          <SegmentedControl
            size="sm"
            label="Resource"
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'cpu', label: 'CPU' },
              { value: 'memory', label: 'Memory' },
            ]}
          />
        </div>
      }
    >
      <div className="h-80 px-2 pb-4 sm:px-4">
        {rows.length < 2 ? (
          <div className="text-muted grid size-full place-items-center text-sm">Collecting samples…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={formatTime}
                tick={{ fill: theme.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: theme.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={44}
                tickFormatter={(v: number) => `${v}%`}
              />
              <ReferenceLine y={threshold} stroke="#ff5a3c" strokeDasharray="6 6" strokeOpacity={0.7} />
              <Tooltip
                cursor={{ stroke: theme.cursor }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as Row | undefined;
                  if (!active || !row) return null;
                  return (
                    <ChartTooltipBox
                      title={`${formatTime(row.time)} · ${metric === 'cpu' ? 'CPU' : 'Memory'}`}
                      rows={RESOURCE_TARGETS.filter((t) => !hidden.has(t.id) && row[t.id] !== undefined).map((t) => ({
                        key: t.id,
                        color: t.color,
                        label: t.label,
                        value: formatPercent(row[t.id]),
                        danger: row[t.id] > threshold,
                      }))}
                    />
                  );
                }}
              />
              {RESOURCE_TARGETS.map((t) => (
                <Line
                  key={t.id}
                  type="monotone"
                  dataKey={t.id}
                  name={t.label}
                  stroke={t.color}
                  strokeWidth={2.4}
                  dot={false}
                  hide={hidden.has(t.id)}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: theme.surface }}
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

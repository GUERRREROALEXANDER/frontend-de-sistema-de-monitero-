import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { SERVICES } from '../../config/services';
import { formatMs, formatShortTime, formatTime } from '../../utils/format';
import { ChartTooltipBox } from '../charts/ChartTooltip';
import { SeriesToggle } from '../charts/SeriesToggle';
import { toggleInSet } from '../../utils/sets';
import { getChartTheme } from '../charts/chartTheme';
import { GlassCard } from '../ui/GlassCard';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Skeleton } from '../ui/Skeleton';
import type { TimeSeriesRow } from '../../utils/analytics';

type Mode = 'req' | 'lat';

interface ThroughputChartProps {
  rows: TimeSeriesRow[];
  loading: boolean;
  isDark: boolean;
}

export function ThroughputChart({ rows, loading, isDark }: ThroughputChartProps) {
  const [mode, setMode] = useState<Mode>('req');
  const [hidden, setHidden] = useState<ReadonlySet<string>>(() => new Set());
  const theme = getChartTheme(isDark);
  const format = (v: number) => (mode === 'req' ? `${v} req` : formatMs(v));

  return (
    <GlassCard
      icon={<TrendingUp className="size-4.5" />}
      title="Traffic over time"
      subtitle="15-second buckets over the last 5 minutes"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SeriesToggle series={SERVICES} hidden={hidden} onToggle={(id) => setHidden((h) => toggleInSet(h, id))} />
          <SegmentedControl
            size="sm"
            label="Metric"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'req', label: 'Requests' },
              { value: 'lat', label: 'Latency' },
            ]}
          />
        </div>
      }
    >
      <div className="h-72 px-2 pb-4 sm:px-4">
        {loading ? (
          <Skeleton className="size-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
              <defs>
                {SERVICES.map((s) => (
                  <linearGradient key={s.id} id={`area-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={theme.grid} vertical={false} />
              <XAxis
                dataKey="time"
                tickFormatter={formatShortTime}
                tick={{ fill: theme.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                tick={{ fill: theme.axis, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={44}
                allowDecimals={false}
                label={{ value: mode === 'req' ? 'req' : 'ms', angle: -90, position: 'insideLeft', fill: theme.axis, fontSize: 11 }}
              />
              <Tooltip
                cursor={{ stroke: theme.cursor, strokeWidth: 1.5 }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as TimeSeriesRow | undefined;
                  if (!active || !row) return null;
                  return (
                    <ChartTooltipBox
                      title={`${formatTime(row.time)} · ${mode === 'req' ? 'requests' : 'avg latency'}`}
                      rows={SERVICES.filter((s) => !hidden.has(s.id) && row[`${s.id}_${mode}`] !== null).map((s) => ({
                        key: s.id,
                        color: s.color,
                        label: s.label,
                        value: format(row[`${s.id}_${mode}`] ?? 0),
                      }))}
                    />
                  );
                }}
              />
              {SERVICES.map((s) => (
                <Area
                  key={`${s.id}-${mode}`}
                  type="monotone"
                  dataKey={`${s.id}_${mode}`}
                  name={s.label}
                  stackId={mode === 'req' ? 'traffic' : undefined}
                  stroke={s.color}
                  strokeWidth={2.2}
                  fill={`url(#area-${s.id})`}
                  hide={hidden.has(s.id)}
                  connectNulls
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: theme.surface }}
                  animationDuration={500}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}

export interface ChartTheme {
  axis: string;
  grid: string;
  /** Background behind data points, so dots get a clean outline */
  surface: string;
  cursor: string;
}

export function getChartTheme(isDark: boolean): ChartTheme {
  return isDark
    ? { axis: '#94a3b8', grid: 'rgba(148, 163, 184, 0.1)', surface: '#111a2e', cursor: 'rgba(96, 165, 250, 0.5)' }
    : { axis: '#64748b', grid: 'rgba(15, 23, 42, 0.07)', surface: '#ffffff', cursor: 'rgba(59, 130, 246, 0.5)' };
}

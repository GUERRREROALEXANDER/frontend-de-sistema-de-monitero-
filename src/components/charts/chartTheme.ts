export interface ChartTheme {
  axis: string;
  grid: string;
  /** Background behind data points, so dots get a clean outline */
  surface: string;
  cursor: string;
}

export function getChartTheme(isDark: boolean): ChartTheme {
  return isDark
    ? { axis: '#a8a29e', grid: 'rgba(255, 237, 213, 0.07)', surface: '#1a120b', cursor: 'rgba(251, 191, 36, 0.35)' }
    : { axis: '#78716c', grid: 'rgba(120, 53, 15, 0.1)', surface: '#fffaf3', cursor: 'rgba(245, 158, 11, 0.45)' };
}

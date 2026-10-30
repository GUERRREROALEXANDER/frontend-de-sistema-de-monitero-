export interface ChartTheme {
  axis: string;
  grid: string;
  /** Background behind data points, so dots get a clean outline */
  surface: string;
  cursor: string;
}

export function getChartTheme(isDark: boolean): ChartTheme {
  return isDark
    ? { axis: '#9b95c2', grid: 'rgba(189, 183, 222, 0.08)', surface: '#151130', cursor: 'rgba(244, 114, 182, 0.45)' }
    : { axis: '#7a74a3', grid: 'rgba(91, 33, 182, 0.08)', surface: '#ffffff', cursor: 'rgba(255, 138, 61, 0.55)' };
}

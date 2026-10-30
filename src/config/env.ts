function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/+$/, ''),
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  pollingIntervalMs: toNumber(import.meta.env.VITE_POLLING_INTERVAL_MS, 3000),
  apiTimeoutMs: toNumber(import.meta.env.VITE_API_TIMEOUT_MS, 8000),
} as const;

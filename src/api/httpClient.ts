import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 400;

interface RetryableConfig extends InternalAxiosRequestConfig {
  __retryCount?: number;
}

/** Only transient failures are retried: network down, timeout, 429 or 5xx. */
function isRetryable(error: AxiosError): boolean {
  if (axios.isCancel(error)) return false;
  if (!error.response) return true;
  const { status } = error.response;
  return status === 429 || status >= 500;
}

function wait(ms: number, signal?: AbortSignal | null): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

httpClient.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetryableConfig | undefined;
  if (!config || !isRetryable(error)) throw error;

  // POST is not idempotent: never retried, so a load simulation is not triggered twice.
  if (config.method?.toLowerCase() === 'post') throw error;

  config.__retryCount = (config.__retryCount ?? 0) + 1;
  if (config.__retryCount > MAX_RETRIES) throw error;

  const backoff = BASE_DELAY_MS * 2 ** (config.__retryCount - 1);
  const jitter = Math.random() * 150;
  await wait(backoff + jitter, config.signal as AbortSignal | undefined);
  return httpClient(config);
});

/** Turns any error into a message that can be shown in the UI. */
export function describeError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'The backend took too long to respond.';
    if (!error.response) return `Could not reach the backend (${env.apiBaseUrl}).`;
    const data = error.response.data as { message?: string } | undefined;
    return data?.message ?? `The backend responded with status ${error.response.status}.`;
  }
  if (error instanceof Error) return error.message;
  return 'Unknown error.';
}

export function isAbortError(error: unknown): boolean {
  return axios.isCancel(error) || (error instanceof DOMException && error.name === 'AbortError');
}

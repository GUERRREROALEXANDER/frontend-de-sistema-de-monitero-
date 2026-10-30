import { env } from '../config/env';
import { httpMonitoringApi } from './httpMonitoringApi';
import { mockMonitoringApi } from './mockMonitoringApi';
import type { MonitoringApi } from '../types/monitoring';

export const monitoringApi: MonitoringApi = env.useMock ? mockMonitoringApi : httpMonitoringApi;

export { describeError, isAbortError } from './httpClient';

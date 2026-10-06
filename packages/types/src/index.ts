export type HospitalType = 'GOVERNMENT' | 'PRIVATE' | 'NON_PROFIT';

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId?: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
  requestId?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export type HealthComponentName = 'application' | 'database' | 'redis' | 'objectStorage';

export type HealthComponentStatus = 'up' | 'down';

/** Error codes are intentionally generic: health output must never expose hosts or credentials. */
export type HealthErrorCode = 'UNREACHABLE' | 'TIMEOUT' | 'CHECK_FAILED';

export interface HealthComponentResult {
  status: HealthComponentStatus;
  latencyMs: number;
  error?: HealthErrorCode;
}

export interface HealthPayload {
  status: HealthStatus;
  service: string;
  timestamp: string;
  version: string;
  checks: Record<HealthComponentName, HealthComponentResult>;
}

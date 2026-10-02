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

export interface HealthPayload {
  status: HealthStatus;
  service: string;
  timestamp: string;
  version: string;
}

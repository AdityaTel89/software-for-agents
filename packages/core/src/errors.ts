export enum ToolErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  AUTH_ERROR = 'AUTH_ERROR',
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
}

export interface ToolError {
  error: true;
  code: ToolErrorCode;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}

export function isToolError(value: unknown): value is ToolError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    (value as Record<string, unknown>).error === true &&
    'code' in value &&
    Object.values(ToolErrorCode).includes(
      (value as Record<string, unknown>).code as ToolErrorCode,
    ) &&
    'message' in value &&
    'retryable' in value
  );
}

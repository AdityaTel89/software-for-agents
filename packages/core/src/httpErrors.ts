import { ToolError, ToolErrorCode } from './errors.js';

export async function normalizeHttpError(
  errorOrResponse: unknown
): Promise<ToolError> {
  // If it's a Response object (or duck-typed equivalent) with a non-2xx status
  if (
    errorOrResponse &&
    typeof errorOrResponse === 'object' &&
    'status' in errorOrResponse &&
    typeof (errorOrResponse as Record<string, unknown>).status === 'number'
  ) {
    const response = errorOrResponse as Response;
    const status = response.status;
    let message = `Upstream API request failed with status ${status}`;
    const details: Record<string, unknown> = { status };

    try {
      if (typeof response.text === 'function') {
        const bodyText = await response.text();
        try {
          const bodyJson = JSON.parse(bodyText);
          details.body = bodyJson;
          if (bodyJson.message) {
            message = bodyJson.message;
          } else if (bodyJson.error) {
            message = typeof bodyJson.error === 'string' ? bodyJson.error : (bodyJson.error.message || message);
          }
        } catch {
          details.body = bodyText;
          if (bodyText && bodyText.length < 200) {
            message = bodyText;
          }
        }
      }
    } catch (_e) {
      // Fail silently if reading body fails
    }

    let code = ToolErrorCode.UPSTREAM_ERROR;
    let retryable = false;

    switch (status) {
      case 400:
        code = ToolErrorCode.VALIDATION_ERROR;
        retryable = false;
        break;
      case 401:
      case 403:
        code = ToolErrorCode.AUTH_ERROR;
        retryable = false;
        break;
      case 404:
        code = ToolErrorCode.NOT_FOUND;
        retryable = false;
        break;
      case 422:
        code = ToolErrorCode.VALIDATION_ERROR;
        retryable = false;
        break;
      case 429:
        code = ToolErrorCode.RATE_LIMITED;
        retryable = true;
        break;
      default:
        if (status >= 500) {
          code = ToolErrorCode.UPSTREAM_ERROR;
          retryable = true;
        }
        break;
    }

    return {
      error: true,
      code,
      message,
      retryable,
      details,
    };
  }

  // If it's a standard JS error or network error
  const error = errorOrResponse as Error;
  const message = error?.message || 'An unknown network or system error occurred';
  
  return {
    error: true,
    code: ToolErrorCode.UPSTREAM_ERROR,
    message,
    retryable: true, // Network/system errors are generally retryable
    details: {
      originalError: error?.stack || error?.message || String(error),
    },
  };
}

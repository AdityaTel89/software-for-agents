import { describe, it, expect } from 'vitest';
import { normalizeHttpError } from './httpErrors.js';
import { ToolErrorCode } from './errors.js';

describe('normalizeHttpError', () => {
  it('should normalize standard JS/network errors', async () => {
    const error = new Error('DNS lookup failed');
    const result = await normalizeHttpError(error);

    expect(result).toEqual({
      error: true,
      code: ToolErrorCode.UPSTREAM_ERROR,
      message: 'DNS lookup failed',
      retryable: true,
      details: {
        originalError: expect.any(String),
      },
    });
  });

  it('should normalize HTTP 400 Bad Request', async () => {
    const response = {
      status: 400,
      text: async () => JSON.stringify({ message: 'Invalid query parameter' }),
    } as unknown as Response;

    const result = await normalizeHttpError(response);

    expect(result.error).toBe(true);
    expect(result.code).toBe(ToolErrorCode.VALIDATION_ERROR);
    expect(result.retryable).toBe(false);
    expect(result.message).toBe('Invalid query parameter');
    expect(result.details?.status).toBe(400);
  });

  it('should normalize HTTP 401 Unauthorized', async () => {
    const response = {
      status: 401,
      text: async () => 'Invalid API key credentials',
    } as unknown as Response;

    const result = await normalizeHttpError(response);

    expect(result.code).toBe(ToolErrorCode.AUTH_ERROR);
    expect(result.retryable).toBe(false);
    expect(result.message).toBe('Invalid API key credentials');
  });

  it('should normalize HTTP 404 Not Found', async () => {
    const response = {
      status: 404,
      text: async () => JSON.stringify({ error: { message: 'Workspace task not found' } }),
    } as unknown as Response;

    const result = await normalizeHttpError(response);

    expect(result.code).toBe(ToolErrorCode.NOT_FOUND);
    expect(result.retryable).toBe(false);
    expect(result.message).toBe('Workspace task not found');
  });

  it('should normalize HTTP 429 Rate Limited', async () => {
    const response = {
      status: 429,
      text: async () => 'Too many requests, try again later',
    } as unknown as Response;

    const result = await normalizeHttpError(response);

    expect(result.code).toBe(ToolErrorCode.RATE_LIMITED);
    expect(result.retryable).toBe(true);
    expect(result.message).toBe('Too many requests, try again later');
  });

  it('should normalize HTTP 503 Service Unavailable', async () => {
    const response = {
      status: 503,
      text: async () => 'Undergoing maintenance',
    } as unknown as Response;

    const result = await normalizeHttpError(response);

    expect(result.code).toBe(ToolErrorCode.UPSTREAM_ERROR);
    expect(result.retryable).toBe(true);
    expect(result.message).toBe('Undergoing maintenance');
  });
});

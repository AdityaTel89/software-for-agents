import { describe, it, expect, vi } from 'vitest';
import { withRetry } from './retry.js';

describe('withRetry', () => {
  it('should return result if fn succeeds on first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const result = await withRetry(fn, {
      retries: 3,
      minTimeout: 1,
      factor: 1,
    });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw error if retries are exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fail'));

    await expect(
      withRetry(fn, {
        retries: 2,
        minTimeout: 1,
        factor: 1,
      }),
    ).rejects.toThrow('always fail');

    expect(fn).toHaveBeenCalledTimes(3); // Initial attempt + 2 retries
  });

  it('should not retry if shouldRetry returns false', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fatal error'));
    const shouldRetry = vi.fn().mockReturnValue(false);

    await expect(
      withRetry(fn, {
        retries: 3,
        minTimeout: 1,
        factor: 1,
        shouldRetry,
      }),
    ).rejects.toThrow('fatal error');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(shouldRetry).toHaveBeenCalledTimes(1);
  });
});

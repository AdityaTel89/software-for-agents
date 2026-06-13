export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  shouldRetry?: (error: unknown) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const retries = options.retries ?? 3;
  const factor = options.factor ?? 2;
  const minTimeout = options.minTimeout ?? 1000;
  const maxTimeout = options.maxTimeout ?? 10000;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt > retries || !shouldRetry(error)) {
        throw error;
      }
      const delay = Math.min(
        minTimeout * Math.pow(factor, attempt - 1),
        maxTimeout
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

import { describe, it, expect } from 'vitest';
import { createLogger } from './logger.js';

describe('createLogger', () => {
  it('should return a pino logger instance', () => {
    const logger = createLogger('test-service');
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });

  it('should redact sensitive keys in logged objects', () => {
    let loggedData = '';
    const mockStream = {
      write: (chunk: string) => {
        loggedData += chunk;
        return true;
      },
    };

    const logger = createLogger('test-redact', mockStream);

    logger.info({
      message: 'test log message',
      api_key: 'secret_key_123',
      token: 'sensitive_token_456',
      authorization: 'Bearer auth_789',
      unaffectedField: 'public_value',
    });

    const parsedLog = JSON.parse(loggedData);

    expect(parsedLog.message).toBe('test log message');
    expect(parsedLog.api_key).toBe('[REDACTED]');
    expect(parsedLog.token).toBe('[REDACTED]');
    expect(parsedLog.authorization).toBe('[REDACTED]');
    expect(parsedLog.unaffectedField).toBe('public_value');
  });
});

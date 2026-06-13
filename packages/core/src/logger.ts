import pino from 'pino';

export function createLogger(serviceName: string, destination?: pino.DestinationStream) {
  return pino(
    {
      name: serviceName,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers["x-api-key"]',
          'headers.authorization',
          'headers["x-api-key"]',
          'authorization',
          'token',
          'key',
          'password',
          'secret',
          'api_key',
          'apikey',
        ],
        censor: '[REDACTED]',
      },
      level: process.env.LOG_LEVEL || 'info',
    },
    destination!,
  );
}

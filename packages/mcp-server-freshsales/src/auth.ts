export function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.FRESHSALES_API_KEY || process.env.TARGET_API_KEY;
  if (!apiKey) {
    throw new Error('FRESHSALES_API_KEY or TARGET_API_KEY environment variable is not set');
  }
  return {
    Authorization: `Token token=${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function getBaseUrl(): string {
  const domain = process.env.FRESHSALES_DOMAIN || process.env.TARGET_API_DOMAIN;
  if (!domain) {
    throw new Error('FRESHSALES_DOMAIN or TARGET_API_DOMAIN environment variable is not set');
  }
  return `https://${domain}.freshsales.io/api`;
}

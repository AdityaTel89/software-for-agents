export function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.NOTION_API_KEY || process.env.TARGET_API_KEY;
  if (!apiKey) {
    throw new Error('NOTION_API_KEY or TARGET_API_KEY environment variable is not set');
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };
}

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as client from './client.js';

describe('Notion API Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, NOTION_API_KEY: 'test-notion-key' };
    vi.useFakeTimers();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should successfully search pages and databases', async () => {
    const mockResponse = {
      object: 'list',
      results: [
        {
          object: 'page',
          id: 'page-id-1',
          properties: {
            title: {
              title: [{ plain_text: 'Test Page' }],
            },
          },
          url: 'https://notion.so/test-page-1',
        },
      ],
      next_cursor: null,
      has_more: false,
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const result = await client.searchPagesAndDatabases(
      'Test',
      { value: 'page', property: 'object' },
      10,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.notion.com/v1/search',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-notion-key',
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          query: 'Test',
          filter: { value: 'page', property: 'object' },
          page_size: 10,
        }),
      }),
    );

    expect(result).toEqual(mockResponse);
  });

  it('should successfully retrieve a single page', async () => {
    const mockPage = {
      object: 'page',
      id: 'page-id',
      properties: {},
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPage,
    } as Response);

    const result = await client.getPage('page-id');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.notion.com/v1/pages/page-id',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(result).toEqual(mockPage);
  });

  it('should retry on 429 status code and succeed when next attempt succeeds', async () => {
    const fetchMock = vi.spyOn(global, 'fetch');

    // First call returns 429
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded',
    } as Response);

    // Second call succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    } as Response);

    // Run the request in a promise so we can advance timers
    const reqPromise = client.getPage('page-id');

    // Advance timers to trigger the retry delay
    await vi.runAllTimersAsync();

    const result = await reqPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: 'ok' });
  });

  it('should throw normalized ToolError when non-retryable 404 error occurs', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ message: 'Page not found' }),
    } as Response);

    await expect(client.getPage('non-existent-page')).rejects.toEqual(
      expect.objectContaining({
        error: true,
        code: 'NOT_FOUND',
        message: 'Page not found',
        retryable: false,
      }),
    );
  });
});

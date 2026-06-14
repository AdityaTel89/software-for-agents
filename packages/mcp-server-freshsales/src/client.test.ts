import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as client from './client.js';

describe('Freshsales API Client', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      FRESHSALES_API_KEY: 'test-freshsales-key',
      FRESHSALES_DOMAIN: 'test-domain',
    };
    vi.useFakeTimers();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should successfully retrieve a single contact', async () => {
    const mockContact = {
      id: 'contact-id-123',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane.doe@example.com',
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ contact: mockContact }),
    } as Response);

    const result = await client.getContact('contact-id-123');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://test-domain.freshsales.io/api/contacts/contact-id-123',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Token token=test-freshsales-key',
          'Content-Type': 'application/json',
        }),
      }),
    );

    expect(result).toEqual(mockContact);
  });

  it('should successfully create a deal', async () => {
    const mockDeal = {
      id: 'deal-id-456',
      name: 'Acme Deal',
      amount: 1000,
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ deal: mockDeal }),
    } as Response);

    const result = await client.createDeal({
      name: 'Acme Deal',
      amount: 1000,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://test-domain.freshsales.io/api/deals',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          deal: {
            name: 'Acme Deal',
            amount: 1000,
          },
        }),
      }),
    );

    expect(result).toEqual(mockDeal);
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
      json: async () => ({ contact: { id: '1', last_name: 'Doe' } }),
    } as Response);

    const reqPromise = client.getContact('1');

    // Advance timers to trigger retry delay
    await vi.runAllTimersAsync();

    const result = await reqPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: '1', last_name: 'Doe' });
  });

  it('should throw normalized ToolError when 404 error occurs', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ message: 'Contact not found' }),
    } as Response);

    await expect(client.getContact('non-existent')).rejects.toEqual(
      expect.objectContaining({
        error: true,
        code: 'NOT_FOUND',
        message: 'Contact not found',
        retryable: false,
      }),
    );
  });
});

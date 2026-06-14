import { withRetry, normalizeHttpError, createLogger } from '@agentapi/core';
import { getAuthHeaders, getBaseUrl } from './auth.js';

const logger = createLogger('mcp-server-freshsales-client');

// Freshsales API Type Definitions
export interface FreshsalesContact {
  id: string;
  first_name?: string;
  last_name: string;
  email?: string;
  mobile_number?: string;
  sales_account_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FreshsalesAccount {
  id: string;
  name: string;
  website?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FreshsalesDeal {
  id: string;
  name: string;
  amount?: number;
  deal_stage_id?: string;
  sales_account_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FreshsalesLead {
  id: string;
  first_name?: string;
  last_name: string;
  email?: string;
  company_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface MetaPagination {
  total?: number;
  pages?: number;
}

export interface FreshsalesListResponse<T> {
  results: T[];
  meta?: MetaPagination;
}

// Wrapper for checking if an object has a status field (for type safety without 'any')
interface StatusObject {
  status: number;
}
function hasStatus(err: unknown): err is StatusObject {
  return typeof err === 'object' && err !== null && 'status' in err;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const responsePromise = async (): Promise<Response> => {
    logger.debug({ method: options.method || 'GET', path }, 'Sending request to Freshsales API');
    const res = await fetch(url, {
      ...options,
      headers,
    });
    if (res.status === 429 || res.status >= 500) {
      logger.warn(
        { status: res.status, path },
        'Freshsales API returned retryable status, throwing for retry',
      );
      throw res;
    }
    return res;
  };

  let response: Response;
  try {
    response = await withRetry(responsePromise, {
      shouldRetry: (error: unknown) => {
        if (hasStatus(error)) {
          return error.status === 429 || error.status >= 500;
        }
        return true; // Network errors
      },
    });
  } catch (error) {
    logger.error({ error, path }, 'Request to Freshsales API failed after retries');
    const normalized = await normalizeHttpError(error);
    throw normalized;
  }

  if (!response.ok) {
    logger.error(
      { status: response.status, path },
      'Request to Freshsales API failed with non-retryable error',
    );
    const normalized = await normalizeHttpError(response);
    throw normalized;
  }

  if (options.method === 'DELETE') {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// === Contacts ===

export async function createContact(
  contactParams: Partial<Omit<FreshsalesContact, 'id'>>,
): Promise<FreshsalesContact> {
  const payload = { contact: contactParams };
  const res = await request<{ contact: FreshsalesContact }>('/contacts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.contact;
}

export async function getContact(id: string): Promise<FreshsalesContact> {
  const res = await request<{ contact: FreshsalesContact }>(`/contacts/${id}`, {
    method: 'GET',
  });
  return res.contact;
}

export async function listContacts(
  page = 1,
  perPage = 25,
): Promise<FreshsalesListResponse<FreshsalesContact>> {
  const queryParams = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const res = await request<{ contacts: FreshsalesContact[]; meta?: MetaPagination }>(
    `/contacts?${queryParams.toString()}`,
    { method: 'GET' },
  );
  return {
    results: res.contacts || [],
    meta: res.meta,
  };
}

export async function updateContact(
  id: string,
  contactParams: Partial<Omit<FreshsalesContact, 'id'>>,
): Promise<FreshsalesContact> {
  const payload = { contact: contactParams };
  const res = await request<{ contact: FreshsalesContact }>(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.contact;
}

export async function deleteContact(id: string): Promise<void> {
  await request<void>(`/contacts/${id}`, {
    method: 'DELETE',
  });
}

// === Sales Accounts ===

export async function createAccount(
  accountParams: Partial<Omit<FreshsalesAccount, 'id'>>,
): Promise<FreshsalesAccount> {
  const payload = { sales_account: accountParams };
  const res = await request<{ sales_account: FreshsalesAccount }>('/sales_accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.sales_account;
}

export async function getAccount(id: string): Promise<FreshsalesAccount> {
  const res = await request<{ sales_account: FreshsalesAccount }>(`/sales_accounts/${id}`, {
    method: 'GET',
  });
  return res.sales_account;
}

export async function listAccounts(
  page = 1,
  perPage = 25,
): Promise<FreshsalesListResponse<FreshsalesAccount>> {
  const queryParams = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const res = await request<{ sales_accounts: FreshsalesAccount[]; meta?: MetaPagination }>(
    `/sales_accounts?${queryParams.toString()}`,
    { method: 'GET' },
  );
  return {
    results: res.sales_accounts || [],
    meta: res.meta,
  };
}

export async function updateAccount(
  id: string,
  accountParams: Partial<Omit<FreshsalesAccount, 'id'>>,
): Promise<FreshsalesAccount> {
  const payload = { sales_account: accountParams };
  const res = await request<{ sales_account: FreshsalesAccount }>(`/sales_accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.sales_account;
}

// === Deals ===

export async function createDeal(
  dealParams: Partial<Omit<FreshsalesDeal, 'id'>>,
): Promise<FreshsalesDeal> {
  const payload = { deal: dealParams };
  const res = await request<{ deal: FreshsalesDeal }>('/deals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.deal;
}

export async function getDeal(id: string): Promise<FreshsalesDeal> {
  const res = await request<{ deal: FreshsalesDeal }>(`/deals/${id}`, {
    method: 'GET',
  });
  return res.deal;
}

export async function listDeals(
  page = 1,
  perPage = 25,
): Promise<FreshsalesListResponse<FreshsalesDeal>> {
  const queryParams = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const res = await request<{ deals: FreshsalesDeal[]; meta?: MetaPagination }>(
    `/deals?${queryParams.toString()}`,
    { method: 'GET' },
  );
  return {
    results: res.deals || [],
    meta: res.meta,
  };
}

export async function updateDeal(
  id: string,
  dealParams: Partial<Omit<FreshsalesDeal, 'id'>>,
): Promise<FreshsalesDeal> {
  const payload = { deal: dealParams };
  const res = await request<{ deal: FreshsalesDeal }>(`/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.deal;
}

// === Leads ===

export async function createLead(
  leadParams: Partial<Omit<FreshsalesLead, 'id'>>,
): Promise<FreshsalesLead> {
  const payload = { lead: leadParams };
  const res = await request<{ lead: FreshsalesLead }>('/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.lead;
}

export async function getLead(id: string): Promise<FreshsalesLead> {
  const res = await request<{ lead: FreshsalesLead }>(`/leads/${id}`, {
    method: 'GET',
  });
  return res.lead;
}

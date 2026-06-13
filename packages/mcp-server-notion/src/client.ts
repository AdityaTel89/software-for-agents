import { withRetry, normalizeHttpError, createLogger } from "@agentapi/core";
import { getAuthHeaders } from "./auth.js";

const logger = createLogger("mcp-server-notion-client");
const BASE_URL = "https://api.notion.com/v1";

// Notion API Type Definitions
export interface NotionRichText {
  type: string;
  plain_text: string;
  text?: {
    content: string;
    link: { url: string } | null;
  };
  annotations?: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
}

export interface NotionProperty {
  id: string;
  type: string;
  title?: NotionRichText[];
  rich_text?: NotionRichText[];
  select?: { id: string; name: string; color: string } | null;
  multi_select?: Array<{ id: string; name: string; color: string }>;
  status?: { id: string; name: string; color: string } | null;
  [key: string]: unknown;
}

export interface NotionDatabaseProperty {
  id: string;
  type: string;
  name: string;
  [key: string]: unknown;
}

export type NotionParent =
  | { type: "database_id"; database_id: string }
  | { type: "page_id"; page_id: string }
  | { type: "workspace"; workspace: boolean };

export interface NotionPage {
  object: "page";
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  properties: Record<string, NotionProperty>;
  url: string;
  parent: NotionParent;
}

export interface NotionDatabase {
  object: "database";
  id: string;
  created_time: string;
  last_edited_time: string;
  title: NotionRichText[];
  properties: Record<string, NotionDatabaseProperty>;
  url: string;
}

export interface NotionBlock {
  object: "block";
  id: string;
  type: string;
  has_children: boolean;
  created_time: string;
  last_edited_time: string;
  [blockTypeContent: string]: unknown;
}

export interface NotionListResponse<T> {
  object: "list";
  results: T[];
  next_cursor: string | null;
  has_more: boolean;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const responsePromise = async () => {
    logger.debug({ method: options.method || "GET", path }, "Sending request to Notion API");
    const res = await fetch(url, {
      ...options,
      headers,
    });
    if (res.status === 429 || res.status >= 500) {
      logger.warn({ status: res.status, path }, "Notion API returned retryable status, throwing for retry");
      throw res;
    }
    return res;
  };

  let response: Response;
  try {
    response = await withRetry(responsePromise, {
      shouldRetry: (error: unknown) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          return status === 429 || status >= 500;
        }
        return true; // Network errors
      }
    });
  } catch (error) {
    logger.error({ error, path }, "Request to Notion API failed after retries");
    const normalized = await normalizeHttpError(error);
    throw normalized;
  }

  if (!response.ok) {
    logger.error({ status: response.status, path }, "Request to Notion API failed with non-retryable error");
    const normalized = await normalizeHttpError(response);
    throw normalized;
  }

  return response.json() as Promise<T>;
}

export interface SearchFilter {
  value: "page" | "database";
  property: "object";
}

export async function searchPagesAndDatabases(
  query?: string,
  filter?: SearchFilter,
  pageSize?: number,
  startCursor?: string
): Promise<NotionListResponse<NotionPage | NotionDatabase>> {
  const body: Record<string, unknown> = {};
  if (query !== undefined) body.query = query;
  if (filter !== undefined) body.filter = filter;
  if (pageSize !== undefined) body.page_size = pageSize;
  if (startCursor !== undefined) body.start_cursor = startCursor;

  return request<NotionListResponse<NotionPage | NotionDatabase>>("/search", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getPage(pageId: string): Promise<NotionPage> {
  return request<NotionPage>(`/pages/${pageId}`, {
    method: "GET",
  });
}

export async function createPage(
  parent: { database_id?: string; page_id?: string },
  properties: Record<string, unknown>,
  children?: unknown[]
): Promise<NotionPage> {
  const body: Record<string, unknown> = {
    parent,
    properties,
  };
  if (children !== undefined) {
    body.children = children;
  }

  return request<NotionPage>("/pages", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updatePageProperties(
  pageId: string,
  properties: Record<string, unknown>
): Promise<NotionPage> {
  return request<NotionPage>(`/pages/${pageId}`, {
    method: "PATCH",
    body: JSON.stringify({ properties }),
  });
}

export async function getBlockChildren(
  blockId: string,
  pageSize?: number,
  startCursor?: string
): Promise<NotionListResponse<NotionBlock>> {
  let path = `/blocks/${blockId}/children`;
  const queryParams = new URLSearchParams();
  if (pageSize !== undefined) queryParams.append("page_size", String(pageSize));
  if (startCursor !== undefined) queryParams.append("start_cursor", startCursor);
  const queryString = queryParams.toString();
  if (queryString) {
    path += `?${queryString}`;
  }

  return request<NotionListResponse<NotionBlock>>(path, {
    method: "GET",
  });
}

export async function appendBlockChildren(
  blockId: string,
  children: unknown[]
): Promise<NotionListResponse<NotionBlock>> {
  return request<NotionListResponse<NotionBlock>>(`/blocks/${blockId}/children`, {
    method: "PATCH",
    body: JSON.stringify({ children }),
  });
}

export async function getDatabase(databaseId: string): Promise<NotionDatabase> {
  return request<NotionDatabase>(`/databases/${databaseId}`, {
    method: "GET",
  });
}

export async function queryDatabase(
  databaseId: string,
  filter?: unknown,
  sorts?: unknown[],
  pageSize?: number,
  startCursor?: string
): Promise<NotionListResponse<NotionPage>> {
  const body: Record<string, unknown> = {};
  if (filter !== undefined) body.filter = filter;
  if (sorts !== undefined) body.sorts = sorts;
  if (pageSize !== undefined) body.page_size = pageSize;
  if (startCursor !== undefined) body.start_cursor = startCursor;

  return request<NotionListResponse<NotionPage>>(`/databases/${databaseId}/query`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

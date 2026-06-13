import { Task, EvalResult, MessageBlock } from "./types.js";

const BASE_URL = "https://api.notion.com/v1";

interface NotionText {
  plain_text: string;
}

interface NotionProperty {
  type: string;
  title?: NotionText[];
  rich_text?: NotionText[];
  select?: { name: string } | null;
  status?: { name: string } | null;
  [key: string]: unknown;
}

interface NotionPage {
  id: string;
  created_time: string;
  properties: Record<string, NotionProperty>;
}

interface NotionBlock {
  id: string;
  type: string;
  child_page?: { title: string };
  [key: string]: unknown;
}

interface NotionListResponse<T> {
  object: "list";
  results: T[];
  has_more: boolean;
  next_cursor: string | null;
}

function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.NOTION_API_KEY || process.env.TARGET_API_KEY;
  if (!apiKey) {
    throw new Error("NOTION_API_KEY or TARGET_API_KEY environment variable is not set");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };
}

async function notionRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Notion API request to ${path} failed with status ${res.status}: ${errText}`);
  }
  return res.json() as Promise<T>;
}

// Extraction helpers for Notion property types
function getPropertyValueAsString(property: NotionProperty): string {
  if (!property) return "";
  switch (property.type) {
    case "title":
      return property.title?.map((t) => t.plain_text).join("") || "";
    case "rich_text":
      return property.rich_text?.map((t) => t.plain_text).join("") || "";
    case "select":
      return property.select?.name || "";
    case "status":
      return property.status?.name || "";
    default:
      return JSON.stringify(property);
  }
}

export async function verifyTask(task: Task, evalResult: EvalResult): Promise<boolean> {
  // If there are tool call sequence checks requested, verify those first
  if (task.success_criteria.type === "tool_call_sequence_or_outcome") {
    const expectedTools = task.success_criteria.expected_tools_used || [];
    const actualToolsUsed: string[] = [];

    for (const msg of evalResult.transcript) {
      if (msg.role === "assistant" && Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === "tool_use") {
            actualToolsUsed.push(block.name);
          }
        }
      }
    }

    const allToolsUsed = expectedTools.every((t) => actualToolsUsed.includes(t));
    if (!allToolsUsed) {
      return false;
    }
  }

  const handlerName = task.success_criteria.verification;
  const params = task.params || {};

  try {
    switch (handlerName) {
      case "verify_page_creation": {
        const databaseId = (process.env.NOTION_TEST_DATABASE_ID || params.database_id) as string | undefined;
        const expectedTitle = (params.expected_title || "Eval Test Page") as string;
        if (!databaseId) {
          throw new Error("database_id missing for verify_page_creation");
        }

        const body = {
          filter: {
            property: "Name",
            title: {
              equals: expectedTitle,
            },
          },
        };

        // Query database for pages
        const response = await notionRequest<NotionListResponse<NotionPage>>(`/databases/${databaseId}/query`, {
          method: "POST",
          body: JSON.stringify(body),
        });

        const createdPage = response.results.find((page) => {
          // Verify it was created recently (within last 5 mins)
          const createdTime = new Date(page.created_time).getTime();
          const fiveMinsAgo = Date.now() - 5 * 60 * 1000;
          return createdTime > fiveMinsAgo;
        });

        if (createdPage) {
          // Archive the page to clean up the sandbox
          await notionRequest<NotionPage>(`/pages/${createdPage.id}`, {
            method: "PATCH",
            body: JSON.stringify({ archived: true }),
          });
          return true;
        }
        return false;
      }

      case "verify_block_append": {
        const pageId = (process.env.NOTION_TEST_PAGE_ID || params.page_id) as string | undefined;
        const expectedText = params.expected_text as string | undefined;
        if (!pageId || !expectedText) {
          throw new Error("page_id or expected_text missing for verify_block_append");
        }

        // Fetch blocks
        const blocksResponse = await notionRequest<NotionListResponse<NotionBlock>>(`/blocks/${pageId}/children`, {
          method: "GET",
        });

        const addedBlock = blocksResponse.results.find((block) => {
          const blockType = block.type;
          const content = block[blockType] as { rich_text?: NotionText[] } | undefined;
          if (content && content.rich_text) {
            const text = content.rich_text.map((t) => t.plain_text).join("");
            return text.includes(expectedText);
          }
          return false;
        });

        if (addedBlock) {
          // Clean up by deleting the block we appended
          await notionRequest<NotionBlock>(`/blocks/${addedBlock.id}`, {
            method: "DELETE",
          });
          return true;
        }
        return false;
      }

      case "verify_properties_update": {
        const pageId = (process.env.NOTION_TEST_PAGE_ID || params.page_id) as string | undefined;
        const expectedPropName = params.property_name as string | undefined;
        const expectedPropValue = params.property_value as string | undefined;
        if (!pageId || !expectedPropName || !expectedPropValue) {
          throw new Error("page_id, property_name, or property_value missing");
        }

        const page = await notionRequest<NotionPage>(`/pages/${pageId}`, {
          method: "GET",
        });

        const prop = page.properties[expectedPropName];
        if (!prop) return false;

        const val = getPropertyValueAsString(prop);
        return val.toLowerCase() === expectedPropValue.toLowerCase();
      }

      case "verify_subpage_creation": {
        const parentId = (process.env.NOTION_TEST_PAGE_ID || params.page_id) as string | undefined;
        const expectedTitle = params.expected_title as string | undefined;
        if (!parentId || !expectedTitle) {
          throw new Error("page_id or expected_title missing");
        }

        const blocksResponse = await notionRequest<NotionListResponse<NotionBlock>>(`/blocks/${parentId}/children`, {
          method: "GET",
        });

        const subpageBlock = blocksResponse.results.find((block) => {
          return block.type === "child_page" && block.child_page?.title === expectedTitle;
        });

        if (subpageBlock) {
          // Clean up subpage
          await notionRequest<NotionPage>(`/pages/${subpageBlock.id}`, {
            method: "PATCH",
            body: JSON.stringify({ archived: true }),
          });
          return true;
        }
        return false;
      }

      case "verify_outcome_only": {
        // Just verify that the last assistant response completed without errors
        const lastMsg = evalResult.transcript[evalResult.transcript.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          // Parse the text block
          const contentBlocks = Array.isArray(lastMsg.content) ? lastMsg.content : [];
          const textBlock = contentBlocks.find(
            (b): b is { type: "text"; text: string } => b.type === "text"
          );
          if (textBlock && textBlock.text) {
            const hasError = evalResult.errors_encountered.length > 0;
            return !hasError;
          }
        }
        return false;
      }

      default:
        console.warn(`Unknown verification handler: ${handlerName}. Defaulting to true.`);
        return evalResult.errors_encountered.length === 0;
    }
  } catch (error) {
    console.error(`Verification error for task ${task.task_id}:`, error);
    return false;
  }
}

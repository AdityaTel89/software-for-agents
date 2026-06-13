import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchTool } from "./tools/search.js";
import { getPageTool } from "./tools/getPage.js";
import { createPageTool } from "./tools/createPage.js";
import * as client from "./client.js";
import { NotionPage, NotionDatabase, NotionListResponse } from "./client.js";

vi.mock("./client.js", () => {
  return {
    searchPagesAndDatabases: vi.fn(),
    getPage: vi.fn(),
    createPage: vi.fn()
  };
});

describe("Notion MCP Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("search tool", () => {
    it("should parse arguments, call client, and map search results", async () => {
      const mockClientResponse: NotionListResponse<NotionPage | NotionDatabase> = {
        object: "list",
        results: [
          {
            object: "page",
            id: "page-1",
            created_time: "2026-06-13T12:00:00.000Z",
            last_edited_time: "2026-06-13T13:00:00.000Z",
            archived: false,
            parent: { type: "page_id", page_id: "parent-1" },
            properties: {
              Name: {
                id: "title",
                type: "title",
                title: [{ type: "text", plain_text: "Alpha Project" }]
              }
            },
            url: "https://notion.so/page-1"
          },
          {
            object: "database",
            id: "db-1",
            created_time: "2026-06-13T12:00:00.000Z",
            last_edited_time: "2026-06-13T13:00:00.000Z",
            title: [{ type: "text", plain_text: "Contacts DB" }],
            properties: {},
            url: "https://notion.so/db-1"
          }
        ],
        next_cursor: "cursor-123",
        has_more: true
      };

      vi.mocked(client.searchPagesAndDatabases).mockResolvedValueOnce(mockClientResponse);

      const args = { query: "Project", page_size: 5 };
      const parsedArgs = searchTool.schema.parse(args);
      const result = await searchTool.handler(parsedArgs);

      expect(client.searchPagesAndDatabases).toHaveBeenCalledWith("Project", undefined, 5, undefined);
      expect(result).toEqual({
        results: [
          { object: "page", id: "page-1", title: "Alpha Project", url: "https://notion.so/page-1" },
          { object: "database", id: "db-1", title: "Contacts DB", url: "https://notion.so/db-1" }
        ],
        next_cursor: "cursor-123",
        has_more: true
      });
    });

    it("should fail validation on invalid arguments", () => {
      expect(() => {
        searchTool.schema.parse({ page_size: "invalid-number" });
      }).toThrow();
    });
  });

  describe("get_page tool", () => {
    it("should retrieve page metadata and return a simplified object", async () => {
      const mockPage: NotionPage = {
        object: "page",
        id: "page-uuid-1",
        created_time: "2026-06-13T12:00:00.000Z",
        last_edited_time: "2026-06-13T13:00:00.000Z",
        archived: false,
        parent: { type: "page_id", page_id: "parent-id" },
        properties: {
          Name: {
            id: "title",
            type: "title",
            title: [{ type: "text", plain_text: "Page Title" }]
          }
        },
        url: "https://notion.so/page-uuid-1"
      };

      vi.mocked(client.getPage).mockResolvedValueOnce(mockPage);

      const parsedArgs = getPageTool.schema.parse({ page_id: "page-uuid-1" });
      const result = await getPageTool.handler(parsedArgs);

      expect(client.getPage).toHaveBeenCalledWith("page-uuid-1");
      expect(result).toEqual({
        id: "page-uuid-1",
        title: "Page Title",
        created_time: "2026-06-13T12:00:00.000Z",
        last_edited_time: "2026-06-13T13:00:00.000Z",
        archived: false,
        properties: mockPage.properties,
        url: "https://notion.so/page-uuid-1"
      });
    });
  });

  describe("create_page tool", () => {
    it("should call client to create page and return mapped info", async () => {
      const mockCreatedPage: NotionPage = {
        object: "page",
        id: "new-page-id",
        created_time: "2026-06-13T13:30:00.000Z",
        last_edited_time: "2026-06-13T13:30:00.000Z",
        archived: false,
        parent: { type: "page_id", page_id: "parent-page-id" },
        properties: {
          Name: {
            id: "title",
            type: "title",
            title: [{ type: "text", plain_text: "New Page Name" }]
          }
        },
        url: "https://notion.so/new-page-id"
      };

      vi.mocked(client.createPage).mockResolvedValueOnce(mockCreatedPage);

      const args = {
        parent: { page_id: "parent-page-id" },
        properties: { Name: { title: [{ text: { content: "New Page Name" } }] } }
      };
      const parsedArgs = createPageTool.schema.parse(args);
      const result = await createPageTool.handler(parsedArgs);

      expect(client.createPage).toHaveBeenCalledWith(
        { page_id: "parent-page-id" },
        args.properties,
        undefined
      );
      expect(result).toEqual({
        id: "new-page-id",
        title: "New Page Name",
        url: "https://notion.so/new-page-id",
        created_time: "2026-06-13T13:30:00.000Z"
      });
    });

    it("should fail validation if parent has neither database_id nor page_id", () => {
      expect(() => {
        createPageTool.schema.parse({
          parent: {},
          properties: {}
        });
      }).toThrow();
    });
  });
});

import { z } from 'zod';
import { searchPagesAndDatabases, NotionPage, NotionDatabase, NotionRichText } from '../client.js';
import { MCPTool } from './helpers.js';

const searchSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("The search term to match against page or database titles, e.g. 'Project Alpha'"),
  filter: z
    .object({
      value: z.enum(['page', 'database']).describe('The type of object to retrieve'),
      property: z.literal('object').describe("Must be 'object'"),
    })
    .optional()
    .describe("Filter results by object type (e.g. only pages or only databases)"),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Number of results to retrieve (default 100, max 100)'),
  start_cursor: z.string().optional().describe('The cursor to start pagination from'),
});

export const searchTool: MCPTool<typeof searchSchema> = {
  name: 'search',
  description:
    "Search all pages and databases shared with this integration. Use this when the user asks to find, locate, list, or search for pages or databases by name. Returns a simplified list containing the object type, UUID, title, and URL. Pitfalls: This tool only searches metadata titles; it does not search inside the page content body. To read a page's content, get its UUID using search first, then call get_block_children.",
  schema: searchSchema,
  handler: async (args) => {
    const res = await searchPagesAndDatabases(
      args.query,
      args.filter,
      args.page_size,
      args.start_cursor,
    );

    return {
      results: res.results.map((item: NotionPage | NotionDatabase) => {
        let title = 'Untitled';
        if (item.object === 'page') {
          // Extract page title dynamically by looking for property of type 'title'
          const titleProp = Object.values(item.properties).find((prop) => prop && prop.type === 'title');
          if (titleProp && titleProp.title && Array.isArray(titleProp.title)) {
            title = titleProp.title.map((t: NotionRichText) => t.plain_text).join('') || 'Untitled';
          }
        } else if (item.object === 'database') {
          if (item.title && Array.isArray(item.title)) {
            title = item.title.map((t: NotionRichText) => t.plain_text).join('') || 'Untitled';
          }
        }

        return {
          object: item.object,
          id: item.id,
          title,
          url: item.url,
        };
      }),
      next_cursor: res.next_cursor || null,
      has_more: res.has_more || false,
    };
  },
};

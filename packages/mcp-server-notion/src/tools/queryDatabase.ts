import { z } from 'zod';
import { queryDatabase, NotionPage } from '../client.js';
import { MCPTool } from './helpers.js';

const queryDatabaseSchema = z.object({
  database_id: z.string().describe('The UUID of the database to query'),
  filter: z
    .unknown()
    .optional()
    .describe("Notion filter object (e.g. { property: 'Status', status: { equals: 'Done' } })"),
  sorts: z
    .array(z.unknown())
    .optional()
    .describe("Notion sort array (e.g. [{ property: 'Name', direction: 'ascending' }])"),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Number of items to return (default 50, max 100)'),
  start_cursor: z.string().optional().describe('The cursor to start pagination from'),
});

export const queryDatabaseTool: MCPTool<typeof queryDatabaseSchema> = {
  name: 'query_database',
  description:
    'Query and filter page records inside a database. Use this when the user asks to list database items, filter rows by values, or sort a database table. Returns a list of matching pages with their properties. Pitfalls: Pages inside the database only return their properties; body content (blocks) must be retrieved with get_block_children.',
  schema: queryDatabaseSchema,
  handler: async (args) => {
    const res = await queryDatabase(
      args.database_id,
      args.filter,
      args.sorts,
      args.page_size,
      args.start_cursor,
    );

    return {
      results: res.results.map((item: NotionPage) => {
        let title = 'Untitled';
        const titleProp = item.properties['title'] || item.properties['Name'];
        if (titleProp && titleProp.title && Array.isArray(titleProp.title)) {
          title = titleProp.title.map((t) => t.plain_text).join('') || 'Untitled';
        }

        return {
          object: item.object,
          id: item.id,
          title,
          properties: item.properties,
          url: item.url,
        };
      }),
      next_cursor: res.next_cursor || null,
      has_more: res.has_more || false,
    };
  },
};

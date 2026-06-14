import { z } from 'zod';
import { createPage, NotionPage } from '../client.js';
import { MCPTool } from './helpers.js';

const createPageSchema = z.object({
  parent: z
    .union([
      z.string().describe('The UUID of the parent database or parent page'),
      z
        .object({
          database_id: z
            .string()
            .optional()
            .describe('The UUID of the parent database (if creating a database item)'),
          page_id: z
            .string()
            .optional()
            .describe('The UUID of the parent page (if creating a sub-page)'),
        })
        .refine((data) => data.database_id || data.page_id, {
          message: 'Either database_id or page_id must be provided',
        }),
    ])
    .describe('The parent object where the page will be created'),
  properties: z
    .record(z.unknown())
    .describe(
      "The properties of the page. If parent is a database, these must match the database's schema (e.g. Name, Status).",
    ),
  children: z
    .array(z.unknown())
    .optional()
    .describe("Optional list of block objects to populate as the page's body content"),
});

export const createPageTool: MCPTool<typeof createPageSchema> = {
  name: 'create_page',
  description:
    "Create a new page under a parent page or inside a database. Use this when the user asks to add a new document, sub-page, log, task, or database entry. If creating inside a database, 'properties' is required and must match the database schema names/types exactly. Returns the created page ID, title, and URL. Pitfalls: Property structures are complex; use 'get_database' first to find the schema of properties if you are unsure.",
  schema: createPageSchema,
  handler: async (args) => {
    // Parent object needs to be clean
    const parentObj: { database_id?: string; page_id?: string } = {};
    
    if (typeof args.parent === 'string') {
      // Decrypt if it's database vs page based on presence of other properties
      const keys = Object.keys(args.properties);
      const isDatabase = keys.length > 1 || (keys.length === 1 && keys[0] !== 'title' && keys[0] !== 'Name');
      if (isDatabase) {
        parentObj.database_id = args.parent;
      } else {
        parentObj.page_id = args.parent;
      }
    } else {
      if (args.parent.database_id) parentObj.database_id = args.parent.database_id;
      if (args.parent.page_id) parentObj.page_id = args.parent.page_id;
    }

    const res: NotionPage = await createPage(parentObj, args.properties, args.children);

    let title = 'Untitled';
    const titleProp = res.properties['title'] || res.properties['Name'];
    if (titleProp && titleProp.title && Array.isArray(titleProp.title)) {
      title = titleProp.title.map((t) => t.plain_text).join('') || 'Untitled';
    }

    return {
      id: res.id,
      title,
      url: res.url,
      created_time: res.created_time,
    };
  },
};

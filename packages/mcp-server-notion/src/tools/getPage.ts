import { z } from 'zod';
import { getPage, NotionPage, NotionRichText } from '../client.js';
import { MCPTool } from './helpers.js';

const getPageSchema = z.object({
  page_id: z
    .string()
    .describe(
      "The UUID of the Notion page to retrieve, e.g. 'c2df479b-2ff7-4c4f-a720-bf4b26710777'",
    ),
});

export const getPageTool: MCPTool<typeof getPageSchema> = {
  name: 'get_page',
  description:
    "Retrieve a single page's metadata and property values by its UUID. Use this when the user asks to inspect page attributes, dates, tags, status, or title. Returns a simplified summary including properties. Pitfalls: This tool does NOT return the block content (the actual text inside the document) — you must call get_block_children using the page UUID to read the page content.",
  schema: getPageSchema,
  handler: async (args) => {
    const res: NotionPage = await getPage(args.page_id);

    // Extract page title dynamically by looking for property of type 'title'
    let title = 'Untitled';
    const titleProp = Object.values(res.properties).find((prop) => prop && prop.type === 'title');
    if (titleProp && titleProp.title && Array.isArray(titleProp.title)) {
      title = titleProp.title.map((t: NotionRichText) => t.plain_text).join('') || 'Untitled';
    }

    return {
      id: res.id,
      title,
      created_time: res.created_time,
      last_edited_time: res.last_edited_time,
      archived: res.archived,
      properties: res.properties,
      url: res.url,
    };
  },
};

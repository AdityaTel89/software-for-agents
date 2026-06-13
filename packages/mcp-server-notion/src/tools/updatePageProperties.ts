import { z } from 'zod';
import { updatePageProperties, NotionPage } from '../client.js';
import { MCPTool } from './helpers.js';

const updatePagePropertiesSchema = z.object({
  page_id: z.string().describe('The UUID of the Notion page to update'),
  properties: z
    .record(z.unknown())
    .describe(
      'Key-value map of properties to update. The keys must match the property names in the parent database, and values must match Notion property formats.',
    ),
});

export const updatePagePropertiesTool: MCPTool<typeof updatePagePropertiesSchema> = {
  name: 'update_page_properties',
  description:
    'Updates the property values of a Notion page (e.g., status, select option, tags, dates, text fields). Use this when the user asks to edit metadata on a page or modify database record columns. Returns the page UUID and updated title. Pitfalls: Does not update body content (blocks) — only updates page headers/database properties. Property shapes vary; use get_page first to check current property formats.',
  schema: updatePagePropertiesSchema,
  handler: async (args) => {
    const res: NotionPage = await updatePageProperties(args.page_id, args.properties);

    let title = 'Untitled';
    const titleProp = res.properties['title'] || res.properties['Name'];
    if (titleProp && titleProp.title && Array.isArray(titleProp.title)) {
      title = titleProp.title.map((t) => t.plain_text).join('') || 'Untitled';
    }

    return {
      id: res.id,
      title,
      url: res.url,
      last_edited_time: res.last_edited_time,
    };
  },
};

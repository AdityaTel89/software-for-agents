import { z } from 'zod';
import { getBlockChildren, NotionBlock, NotionRichText } from '../client.js';
import { MCPTool } from './helpers.js';

const getBlockChildrenSchema = z.object({
  block_id: z.string().describe('The UUID of the parent block or page to retrieve content from'),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Number of blocks to retrieve (default 100, max 100)'),
  start_cursor: z.string().optional().describe('The cursor to start pagination from'),
});

interface BlockContent {
  rich_text?: NotionRichText[];
  title?: string;
  checked?: boolean;
}

export const getBlockChildrenTool: MCPTool<typeof getBlockChildrenSchema> = {
  name: 'get_block_children',
  description:
    'Retrieve block children (content elements) of a parent page or block. Use this when the user asks to read, display, or inspect the text and content of a Notion page. Returns a simplified list of block elements with their UUIDs, block types (e.g. paragraph, heading_1, child_page), child presence flags, and extracted plain text. Pitfalls: Pages are tree structures; nested content (like lists, tables, callouts) may require calling get_block_children recursively using the child block UUID if has_children is true.',
  schema: getBlockChildrenSchema,
  handler: async (args) => {
    const res = await getBlockChildren(args.block_id, args.page_size, args.start_cursor);

    return {
      results: res.results.map((block: NotionBlock) => {
        let text = '';
        const type = block.type;
        const blockContent = block[type] as BlockContent | undefined;

        if (blockContent && blockContent.rich_text && Array.isArray(blockContent.rich_text)) {
          text = blockContent.rich_text.map((t) => t.plain_text).join('') || '';
        } else if (type === 'child_page' && blockContent) {
          text = blockContent.title || 'Child Page';
        } else if (type === 'child_database' && blockContent) {
          text = blockContent.title || 'Child Database';
        } else if (type === 'todo' && blockContent) {
          text = `${blockContent.checked ? '[x]' : '[ ]'} ${blockContent.rich_text?.map((t) => t.plain_text).join('') || ''}`;
        }

        return {
          id: block.id,
          type,
          has_children: block.has_children || false,
          text: text || undefined,
        };
      }),
      next_cursor: res.next_cursor || null,
      has_more: res.has_more || false,
    };
  },
};

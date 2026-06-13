import { z } from "zod";
import { appendBlockChildren, NotionBlock } from "../client.js";
import { MCPTool } from "./helpers.js";

const appendBlockChildrenSchema = z.object({
  block_id: z.string().describe("The UUID of the page or block to append content to"),
  children: z.array(z.unknown()).describe("List of Notion block objects to append (e.g., paragraphs, headings, bullet lists)")
});

export const appendBlockChildrenTool: MCPTool<typeof appendBlockChildrenSchema> = {
  name: "append_block_children",
  description: "Append block content (text, lists, headers, etc.) to a parent block or page. Use this when the user asks to write text, add comments, append notes, or insert bullet points to a page. Returns a list of newly created block metadata. Pitfalls: Children must be valid Notion block structures (e.g. { object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: 'text' } }] } }).",
  schema: appendBlockChildrenSchema,
  handler: async (args) => {
    const res = await appendBlockChildren(args.block_id, args.children);

    return {
      results: res.results.map((block: NotionBlock) => ({
        id: block.id,
        type: block.type
      }))
    };
  }
};

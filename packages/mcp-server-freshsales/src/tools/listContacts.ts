import { z } from 'zod';
import { listContacts, FreshsalesListResponse, FreshsalesContact } from '../client.js';
import { MCPTool } from './helpers.js';

const listContactsSchema = z.object({
  page: z.number().optional().describe("The page number to retrieve, e.g. 1 (defaults to 1)"),
  per_page: z.number().optional().describe("The number of contacts to return per page, e.g. 25 (defaults to 25, max 250)"),
});

export const listContactsTool: MCPTool<typeof listContactsSchema> = {
  name: 'list_contacts',
  description:
    "List CRM contacts in Freshsales with pagination. Use this when the user asks to view all contacts, list contacts, or browse contacts. Returns a list of contacts and pagination metadata. Pitfall: Do not assume all contacts are returned in one call. Use the page parameter to traverse multiple pages if needed.",
  schema: listContactsSchema,
  handler: async (args): Promise<FreshsalesListResponse<FreshsalesContact>> => {
    return listContacts(args.page, args.per_page);
  },
};

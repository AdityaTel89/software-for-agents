import { z } from 'zod';
import { listAccounts, FreshsalesListResponse, FreshsalesAccount } from '../client.js';
import { MCPTool } from './helpers.js';

const listAccountsSchema = z.object({
  page: z.number().optional().describe("The page number to retrieve, e.g. 1 (defaults to 1)"),
  per_page: z.number().optional().describe("The number of accounts to return per page, e.g. 25 (defaults to 25, max 250)"),
});

export const listAccountsTool: MCPTool<typeof listAccountsSchema> = {
  name: 'list_accounts',
  description:
    "List sales accounts (companies) in Freshsales with pagination. Use this when the user asks to list accounts, show companies, or browse registered accounts. Returns a list of account objects and pagination metadata. Pitfall: Paginate through pages using page and per_page parameters if there are many accounts.",
  schema: listAccountsSchema,
  handler: async (args): Promise<FreshsalesListResponse<FreshsalesAccount>> => {
    return listAccounts(args.page, args.per_page);
  },
};

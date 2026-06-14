import { z } from 'zod';
import { getAccount, FreshsalesAccount } from '../client.js';
import { MCPTool } from './helpers.js';

const getAccountSchema = z.object({
  id: z.string().describe("The unique ID of the sales account/company to retrieve, e.g. '12000456123'"),
});

export const getAccountTool: MCPTool<typeof getAccountSchema> = {
  name: 'get_account',
  description:
    "Retrieve details of a single sales account (company profile) by its unique ID in Freshsales. Use this when the user asks to inspect, view, or get information about a company/account. Returns the account's details. Pitfall: The ID must be valid. Run list_accounts first if you do not know the ID.",
  schema: getAccountSchema,
  handler: async (args): Promise<FreshsalesAccount> => {
    return getAccount(args.id);
  },
};

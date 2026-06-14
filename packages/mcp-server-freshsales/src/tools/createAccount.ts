import { z } from 'zod';
import { createAccount, FreshsalesAccount } from '../client.js';
import { MCPTool } from './helpers.js';

const createAccountSchema = z.object({
  name: z.string().describe("The name of the company or sales account, e.g. 'Acme Corporation'"),
  website: z.string().optional().describe("The website URL of the company, e.g. 'https://acme.com'"),
  phone: z.string().optional().describe("The primary phone number for the company, e.g. '555-0100'"),
});

export const createAccountTool: MCPTool<typeof createAccountSchema> = {
  name: 'create_account',
  description:
    "Create a new sales account (company profile) in Freshsales. Use this when the user asks to add, create, or save a company/account. Returns the created account details including its unique ID. Pitfall: Verify if the account name is unique to avoid creating duplicate company records.",
  schema: createAccountSchema,
  handler: async (args): Promise<FreshsalesAccount> => {
    return createAccount(args);
  },
};

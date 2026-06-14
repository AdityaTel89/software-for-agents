import { z } from 'zod';
import { updateAccount, FreshsalesAccount } from '../client.js';
import { MCPTool } from './helpers.js';

const updateAccountSchema = z.object({
  id: z.string().describe("The unique ID of the sales account/company to update, e.g. '12000456123'"),
  name: z.string().optional().describe("Updated company name, e.g. 'Acme Corporation'"),
  website: z.string().optional().describe("Updated website URL, e.g. 'https://acme.com'"),
  phone: z.string().optional().describe("Updated primary phone number, e.g. '555-0100'"),
});

export const updateAccountTool: MCPTool<typeof updateAccountSchema> = {
  name: 'update_account',
  description:
    "Update one or more properties of an existing sales account (company profile) by ID in Freshsales. Use this when the user asks to update, edit, modify, or change company details. Returns the updated account. Pitfall: Ensure a valid ID is provided and only supply fields that are modifying.",
  schema: updateAccountSchema,
  handler: async (args): Promise<FreshsalesAccount> => {
    const { id, ...params } = args;
    return updateAccount(id, params);
  },
};

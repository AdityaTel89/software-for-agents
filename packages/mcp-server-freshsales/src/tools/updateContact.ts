import { z } from 'zod';
import { updateContact, FreshsalesContact } from '../client.js';
import { MCPTool } from './helpers.js';

const updateContactSchema = z.object({
  id: z.string().describe("The unique ID of the contact to update, e.g. '12000456123'"),
  first_name: z.string().optional().describe("Updated first name, e.g. 'John'"),
  last_name: z.string().optional().describe("Updated last name, e.g. 'Doe'"),
  email: z.string().optional().describe("Updated email address, e.g. 'john.doe@example.com'"),
  mobile_number: z.string().optional().describe("Updated mobile number, e.g. '+15550199'"),
  sales_account_id: z.string().optional().describe("Updated sales account/company ID, e.g. '12000456123'"),
});

export const updateContactTool: MCPTool<typeof updateContactSchema> = {
  name: 'update_contact',
  description:
    "Update one or more properties of an existing contact by ID in Freshsales. Use this when the user asks to update, edit, modify, or change contact info. Returns the updated contact details. Pitfall: You must provide a valid contact ID. Only specify the fields that actually need to be changed.",
  schema: updateContactSchema,
  handler: async (args): Promise<FreshsalesContact> => {
    const { id, ...params } = args;
    return updateContact(id, params);
  },
};

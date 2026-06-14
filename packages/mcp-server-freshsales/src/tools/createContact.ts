import { z } from 'zod';
import { createContact, FreshsalesContact } from '../client.js';
import { MCPTool } from './helpers.js';

const createContactSchema = z.object({
  first_name: z.string().optional().describe("First name of the contact, e.g. 'John'"),
  last_name: z.string().describe("Last name of the contact, e.g. 'Doe'"),
  email: z.string().optional().describe("Email address of the contact, e.g. 'john.doe@example.com'"),
  mobile_number: z.string().optional().describe("Mobile phone number of the contact, e.g. '+15550199'"),
  sales_account_id: z.string().optional().describe("The UUID of the sales account/company this contact belongs to, e.g. '12000456123'"),
});

export const createContactTool: MCPTool<typeof createContactSchema> = {
  name: 'create_contact',
  description:
    "Create a new CRM contact in Freshsales. Use this when the user explicitly asks to add, create, or save a contact. Returns the created contact details including its unique ID. Common pitfall: Verify if the contact already exists before creating by listing or searching. Make sure the sales_account_id is a valid UUID obtained from get_account or list_accounts.",
  schema: createContactSchema,
  handler: async (args): Promise<FreshsalesContact> => {
    return createContact(args);
  },
};

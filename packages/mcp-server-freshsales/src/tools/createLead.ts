import { z } from 'zod';
import { createLead, FreshsalesLead } from '../client.js';
import { MCPTool } from './helpers.js';

const createLeadSchema = z.object({
  first_name: z.string().optional().describe("First name of the lead, e.g. 'John'"),
  last_name: z.string().describe("Last name of the lead, e.g. 'Doe'"),
  email: z.string().optional().describe("Email address of the lead, e.g. 'john.doe@example.com'"),
  company_name: z.string().optional().describe("The name of the company the lead works for, e.g. 'Lead Company LLC'"),
});

export const createLeadTool: MCPTool<typeof createLeadSchema> = {
  name: 'create_lead',
  description:
    "Create a new CRM lead in Freshsales. Use this when the user explicitly asks to add, create, or save a lead. Returns the created lead details. Pitfall: Verify if the lead already exists before creating by checking your records or listing. Leads are unqualified contacts and are distinct from Contacts.",
  schema: createLeadSchema,
  handler: async (args): Promise<FreshsalesLead> => {
    return createLead(args);
  },
};

import { z } from 'zod';
import { getContact, FreshsalesContact } from '../client.js';
import { MCPTool } from './helpers.js';

const getContactSchema = z.object({
  id: z.string().describe("The unique ID of the contact to retrieve, e.g. '12000456123'"),
});

export const getContactTool: MCPTool<typeof getContactSchema> = {
  name: 'get_contact',
  description:
    "Retrieve details of a single contact in Freshsales by its unique ID. Use this when the user asks to view, inspect, or get information about a specific contact. Returns the contact's properties (names, email, phone, account association). Pitfall: The ID must be a valid ID string. If the ID is unknown, run list_contacts first to locate it.",
  schema: getContactSchema,
  handler: async (args): Promise<FreshsalesContact> => {
    return getContact(args.id);
  },
};

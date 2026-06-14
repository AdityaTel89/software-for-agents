import { z } from 'zod';
import { getLead, FreshsalesLead } from '../client.js';
import { MCPTool } from './helpers.js';

const getLeadSchema = z.object({
  id: z.string().describe("The unique ID of the lead to retrieve, e.g. '12000456123'"),
});

export const getLeadTool: MCPTool<typeof getLeadSchema> = {
  name: 'get_lead',
  description:
    "Retrieve details of a single lead in Freshsales by its unique ID. Use this when the user asks to inspect, view, or get information about a lead. Returns the lead's details. Pitfall: The ID must be valid. If the ID is unknown, run search or list leads first to locate it.",
  schema: getLeadSchema,
  handler: async (args): Promise<FreshsalesLead> => {
    return getLead(args.id);
  },
};

import { z } from 'zod';
import { getDeal, FreshsalesDeal } from '../client.js';
import { MCPTool } from './helpers.js';

const getDealSchema = z.object({
  id: z.string().describe("The unique ID of the deal to retrieve, e.g. '12000456123'"),
});

export const getDealTool: MCPTool<typeof getDealSchema> = {
  name: 'get_deal',
  description:
    "Retrieve details of a single deal by its unique ID in Freshsales. Use this when the user asks to inspect, view, or check status on a specific deal. Returns the deal details. Pitfall: The ID must be valid. Run list_deals first if you do not know the ID.",
  schema: getDealSchema,
  handler: async (args): Promise<FreshsalesDeal> => {
    return getDeal(args.id);
  },
};

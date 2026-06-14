import { z } from 'zod';
import { updateDeal, FreshsalesDeal } from '../client.js';
import { MCPTool } from './helpers.js';

const updateDealSchema = z.object({
  id: z.string().describe("The unique ID of the deal to update, e.g. '12000456123'"),
  name: z.string().optional().describe("Updated name of the deal, e.g. 'Enterprise License Agreement'"),
  amount: z.number().optional().describe("Updated estimated monetary value of the deal, e.g. 15000.00"),
  deal_stage_id: z.string().optional().describe("Updated deal stage ID, e.g. 'Won' or 'Lost'"),
});

export const updateDealTool: MCPTool<typeof updateDealSchema> = {
  name: 'update_deal',
  description:
    "Update one or more properties of an existing deal by ID in Freshsales. Use this when the user asks to update a deal, modify an opportunity, or change its stage or amount. Returns the updated deal. Pitfall: Ensure a valid ID is provided and only supply fields that are modifying.",
  schema: updateDealSchema,
  handler: async (args): Promise<FreshsalesDeal> => {
    const { id, ...params } = args;
    return updateDeal(id, params);
  },
};

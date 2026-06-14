import { z } from 'zod';
import { createDeal, FreshsalesDeal } from '../client.js';
import { MCPTool } from './helpers.js';

const createDealSchema = z.object({
  name: z.string().describe("The name of the deal/opportunity, e.g. 'Enterprise License Agreement'"),
  amount: z.number().optional().describe("The estimated monetary value of the deal, e.g. 15000.00"),
  deal_stage_id: z.string().optional().describe("The ID of the stage the deal is in, e.g. 'New' or 'In Progress'"),
  sales_account_id: z.string().optional().describe("The ID of the sales account/company associated with this deal, e.g. '12000456123'"),
});

export const createDealTool: MCPTool<typeof createDealSchema> = {
  name: 'create_deal',
  description:
    "Create a new deal (sales opportunity) in Freshsales. Use this when the user asks to create, add, or open a deal or opportunity. Returns the created deal details. Pitfall: If associating the deal with an account, make sure sales_account_id is a valid UUID obtained from get_account or list_accounts.",
  schema: createDealSchema,
  handler: async (args): Promise<FreshsalesDeal> => {
    return createDeal(args);
  },
};

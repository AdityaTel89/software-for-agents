import { z } from 'zod';
import { listDeals, FreshsalesListResponse, FreshsalesDeal } from '../client.js';
import { MCPTool } from './helpers.js';

const listDealsSchema = z.object({
  page: z.number().optional().describe("The page number to retrieve, e.g. 1 (defaults to 1)"),
  per_page: z.number().optional().describe("The number of deals to return per page, e.g. 25 (defaults to 25, max 250)"),
});

export const listDealsTool: MCPTool<typeof listDealsSchema> = {
  name: 'list_deals',
  description:
    "List CRM deals (sales opportunities) in Freshsales with pagination. Use this when the user asks to see all deals, list opportunities, or browse sales transactions. Returns a list of deals and pagination metadata. Pitfall: Paginate through pages using page and per_page parameters if there are many deals.",
  schema: listDealsSchema,
  handler: async (args): Promise<FreshsalesListResponse<FreshsalesDeal>> => {
    return listDeals(args.page, args.per_page);
  },
};

import { z } from "zod";
import { getDatabase, NotionDatabase } from "../client.js";
import { MCPTool } from "./helpers.js";

const getDatabaseSchema = z.object({
  database_id: z.string().describe("The UUID of the Notion database to retrieve")
});

export const getDatabaseTool: MCPTool<typeof getDatabaseSchema> = {
  name: "get_database",
  description: "Retrieve schema details, title, and property definitions for a database by its UUID. Use this when the user asks to see columns, fields, or properties configuration of a table/database, or before creating/updating items in a database to inspect the property types. Returns title and properties schema. Pitfalls: This does NOT return the rows or records inside the database. To search or list pages inside the database, call query_database.",
  schema: getDatabaseSchema,
  handler: async (args) => {
    const res: NotionDatabase = await getDatabase(args.database_id);

    let title = "Untitled Database";
    if (res.title && Array.isArray(res.title)) {
      title = res.title.map((t) => t.plain_text).join("") || "Untitled Database";
    }

    return {
      id: res.id,
      title,
      properties: res.properties,
      url: res.url
    };
  }
};

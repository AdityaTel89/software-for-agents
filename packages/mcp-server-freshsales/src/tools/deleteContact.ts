import { z } from 'zod';
import { deleteContact } from '../client.js';
import { MCPTool } from './helpers.js';

const deleteContactSchema = z.object({
  id: z.string().describe("The unique ID of the contact to delete, e.g. '12000456123'"),
});

export const deleteContactTool: MCPTool<typeof deleteContactSchema> = {
  name: 'delete_contact',
  description:
    "Delete a contact by its unique ID in Freshsales. Use this when the user explicitly asks to delete or remove a contact. Returns a success confirmation message. Pitfall: Deleting a contact is permanent. Double check the ID before executing.",
  schema: deleteContactSchema,
  handler: async (args) => {
    await deleteContact(args.id);
    return {
      success: true,
      message: `Contact with ID ${args.id} has been successfully deleted.`,
    };
  },
};

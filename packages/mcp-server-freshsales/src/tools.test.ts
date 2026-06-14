import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createContactTool } from './tools/createContact.js';
import { getContactTool } from './tools/getContact.js';
import { updateContactTool } from './tools/updateContact.js';
import * as client from './client.js';
import { FreshsalesContact } from './client.js';

vi.mock('./client.js', () => {
  return {
    createContact: vi.fn(),
    getContact: vi.fn(),
    updateContact: vi.fn(),
  };
});

describe('Freshsales MCP Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create_contact tool', () => {
    it('should successfully parse arguments, call client, and return contact', async () => {
      const mockContact: FreshsalesContact = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      };

      vi.mocked(client.createContact).mockResolvedValueOnce(mockContact);

      const args = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
      };
      const parsedArgs = createContactTool.schema.parse(args);
      const result = await createContactTool.handler(parsedArgs);

      expect(client.createContact).toHaveBeenCalledWith(args);
      expect(result).toEqual(mockContact);
    });

    it('should fail validation on missing required arguments', () => {
      expect(() => {
        createContactTool.schema.parse({ first_name: 'John' }); // missing last_name
      }).toThrow();
    });
  });

  describe('get_contact tool', () => {
    it('should retrieve contact metadata and return it', async () => {
      const mockContact: FreshsalesContact = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe',
      };

      vi.mocked(client.getContact).mockResolvedValueOnce(mockContact);

      const parsedArgs = getContactTool.schema.parse({ id: '123' });
      const result = await getContactTool.handler(parsedArgs);

      expect(client.getContact).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockContact);
    });
  });

  describe('update_contact tool', () => {
    it('should update contact and return it', async () => {
      const mockContact: FreshsalesContact = {
        id: '123',
        first_name: 'John',
        last_name: 'Doe-Smith',
      };

      vi.mocked(client.updateContact).mockResolvedValueOnce(mockContact);

      const parsedArgs = updateContactTool.schema.parse({
        id: '123',
        last_name: 'Doe-Smith',
      });
      const result = await updateContactTool.handler(parsedArgs);

      expect(client.updateContact).toHaveBeenCalledWith('123', { last_name: 'Doe-Smith' });
      expect(result).toEqual(mockContact);
    });
  });
});

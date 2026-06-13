import { z } from 'zod';
import { JSONSchemaProperty } from '@agentapi/core';

export function zodToMcpSchema(zodSchema: z.ZodObject<z.ZodRawShape>): {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
} {
  const properties: Record<string, JSONSchemaProperty> = {};
  const required: string[] = [];

  const shape = zodSchema.shape;
  for (const key of Object.keys(shape)) {
    const field = shape[key];
    let isRequired = true;
    let currentField = field;

    // Handle optional fields
    if (currentField instanceof z.ZodOptional) {
      isRequired = false;
      currentField = currentField._def.innerType;
    } else if (currentField instanceof z.ZodNullable) {
      currentField = currentField._def.innerType;
    }

    // Determine type and details
    let typeName = 'string';
    const desc = field.description || currentField.description || undefined;
    const extraProperties: Record<string, unknown> = {};

    if (currentField instanceof z.ZodString) {
      typeName = 'string';
    } else if (currentField instanceof z.ZodNumber) {
      typeName = 'number';
    } else if (currentField instanceof z.ZodBoolean) {
      typeName = 'boolean';
    } else if (currentField instanceof z.ZodObject) {
      typeName = 'object';
      const subSchema = zodToMcpSchema(currentField);
      extraProperties.properties = subSchema.properties;
      extraProperties.required = subSchema.required;
    } else if (currentField instanceof z.ZodArray) {
      typeName = 'array';
      const itemType = currentField._def.type;
      if (itemType instanceof z.ZodObject) {
        const subSchema = zodToMcpSchema(itemType);
        extraProperties.items = {
          type: 'object',
          properties: subSchema.properties,
          required: subSchema.required,
        };
      } else if (itemType instanceof z.ZodString) {
        extraProperties.items = { type: 'string' };
      }
    } else if (currentField instanceof z.ZodEnum) {
      typeName = 'string';
      extraProperties.enum = currentField._def.values;
    }

    properties[key] = {
      type: typeName,
      description: desc,
      ...extraProperties,
    } as JSONSchemaProperty;

    if (isRequired) {
      required.push(key);
    }
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

export interface MCPTool<T extends z.ZodObject<z.ZodRawShape>> {
  name: string;
  description: string;
  schema: T;
  handler: (args: z.infer<T>) => Promise<unknown>;
}

export interface AnyMCPTool {
  name: string;
  description: string;
  schema: z.ZodObject<z.ZodRawShape>;
  handler: (args: never) => Promise<unknown>;
}

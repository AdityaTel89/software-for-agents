import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createLogger, isToolError } from '@agentapi/core';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Import all tools
import { searchTool } from './tools/search.js';
import { getPageTool } from './tools/getPage.js';
import { createPageTool } from './tools/createPage.js';
import { updatePagePropertiesTool } from './tools/updatePageProperties.js';
import { getBlockChildrenTool } from './tools/getBlockChildren.js';
import { appendBlockChildrenTool } from './tools/appendBlockChildren.js';
import { getDatabaseTool } from './tools/getDatabase.js';
import { queryDatabaseTool } from './tools/queryDatabase.js';
import { zodToMcpSchema, AnyMCPTool } from './tools/helpers.js';

const logger = createLogger('mcp-server-notion');

const tools: AnyMCPTool[] = [
  searchTool,
  getPageTool,
  createPageTool,
  updatePagePropertiesTool,
  getBlockChildrenTool,
  appendBlockChildrenTool,
  getDatabaseTool,
  queryDatabaseTool,
];

// Initialize MCP Server
const server = new Server(
  {
    name: 'mcp-server-notion',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Register Tool Listing Handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.info('Handling tools/list request');
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToMcpSchema(tool.schema),
    })),
  };
});

// Register Tool Calling Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.info({ name }, 'Handling tools/call request');

  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    logger.error({ name }, 'Requested tool not found');
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            code: 'NOT_FOUND',
            message: `Tool ${name} was not found on this server.`,
            retryable: false,
          }),
        },
      ],
      isError: true,
    };
  }

  try {
    const parsedArgs = tool.schema.parse(args || {});
    const result = await tool.handler(parsedArgs as never);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: unknown) {
    logger.error({ name, error }, 'Error executing tool handler');

    // Check if it is already a normalized ToolError from client
    if (isToolError(error)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(error),
          },
        ],
        isError: true,
      };
    }

    // Handle Zod Schema validation errors cleanly for the agent
    if (error instanceof z.ZodError) {
      const issues = error.issues
        ? error.issues.map((iss: z.ZodIssue) => `${iss.path.join('.') || 'root'}: ${iss.message}`).join(', ')
        : 'Invalid arguments';
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: true,
              code: 'VALIDATION_ERROR',
              message: `Arguments validation failed: ${issues}`,
              retryable: false,
              details: error.format ? error.format() : error,
            }),
          },
        ],
        isError: true,
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    // Fallback error mapping
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: true,
            code: 'VALIDATION_ERROR',
            message: errorMessage,
            retryable: false,
          }),
        },
      ],
      isError: true,
    };
  }
});

const isSse = process.argv.includes('--sse');

if (isSse) {
  // Configure Express app
  const app = express();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  const transportMap = new Map<string, SSEServerTransport>();

  app.get('/sse', async (req, res) => {
    logger.info('New SSE connection requested');

    // Create transport pointing POST messages to '/messages' endpoint
    const transport = new SSEServerTransport('/messages', res);

    const sessionId = transport.sessionId;
    transportMap.set(sessionId, transport);
    logger.info({ sessionId }, 'Created SSE transport session');

    transport.onclose = () => {
      logger.info({ sessionId }, 'SSE transport session closed');
      transportMap.delete(sessionId);
    };

    transport.onerror = (error) => {
      logger.error({ sessionId, error }, 'SSE transport error');
    };

    await server.connect(transport);
  });

  // NOTE: Do NOT use express.json() middleware globally or on this endpoint.
  // SSEServerTransport.handlePostMessage handles stream parsing internally.
  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transportMap.get(sessionId);

    if (!transport) {
      logger.warn({ sessionId }, 'Message POST received for non-existent session');
      res.status(404).send('Session not found');
      return;
    }

    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      logger.error({ sessionId, error }, 'Error handling POST message');
    }
  });

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      activeSessions: transportMap.size,
    });
  });

  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    logger.info(`Notion MCP Server running on port ${port} in SSE mode`);
  });
} else {
  // Stdio mode for local Claude Desktop config
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Notion MCP Server running in Stdio mode');
}

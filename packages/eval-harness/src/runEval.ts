import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { Task, EvalResult, ChatMessage, MessageBlock } from "./types.js";

export async function runEval(task: Task, serverUrl: string): Promise<EvalResult> {
  const transport = new SSEClientTransport(new URL(serverUrl));
  const mcpClient = new Client(
    {
      name: "eval-harness-client",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const anthropic = new Anthropic({ apiKey });
  const transcript: ChatMessage[] = [];
  const errors: string[] = [];
  let steps = 0;

  try {
    // 1. Connect to MCP server
    await mcpClient.connect(transport);

    // 2. Fetch tools and map to Anthropic SDK format
    const toolsResult = await mcpClient.listTools();
    const anthropicTools = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description || "",
      input_schema: tool.inputSchema as { type: "object"; properties: Record<string, unknown>; required?: string[] },
    }));

    // 3. Interpolate environment variables in the description
    let description = task.description;
    const matches = description.match(/\{\{([A-Z0-9_]+)\}\}/g);
    if (matches) {
      for (const match of matches) {
        const envVarName = match.substring(2, match.length - 2);
        const envVarValue = process.env[envVarName] || "";
        description = description.replace(match, envVarValue);
      }
    }

    transcript.push({
      role: "user",
      content: description,
    });

    let conversationEnded = false;

    // 4. Conversation loop
    while (steps < task.max_steps && !conversationEnded) {
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 4000,
        system:
          "You are a helpful assistant with access to tools. Perform the requested task. Be concise and precise. Follow all tool requirements exactly.",
        messages: transcript.map((msg) => ({
          role: msg.role,
          content: msg.content as Anthropic.MessageParam["content"],
        })),
        tools: anthropicTools,
      });

      transcript.push({
        role: "assistant",
        content: response.content as unknown as MessageBlock[],
      });

      steps++;

      const toolCalls = response.content.filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
      if (toolCalls.length === 0) {
        conversationEnded = true;
        break;
      }

      // Execute tool calls via MCP client
      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall: Anthropic.ToolUseBlock) => {
          try {
            const result = await mcpClient.callTool({
              name: toolCall.name,
              arguments: toolCall.input as Record<string, unknown>,
            });
            return {
              type: "tool_result" as const,
              tool_use_id: toolCall.id,
              content: result.content as Array<{ type: "text"; text: string }>,
            };
          } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            errors.push(`Tool execution error for '${toolCall.name}': ${errMsg}`);
            return {
              type: "tool_result" as const,
              tool_use_id: toolCall.id,
              content: [{ type: "text" as const, text: `Error: ${errMsg}` }],
              is_error: true,
            };
          }
        })
      );

      transcript.push({
        role: "user",
        content: toolResults as unknown as MessageBlock[],
      });
    }

    return {
      task_id: task.task_id,
      success: false, // Will be verified by the verifier
      steps_used: steps,
      errors_encountered: errors,
      transcript,
    };
  } finally {
    try {
      await mcpClient.close();
    } catch {
      // Ignore cleanup errors
    }
  }
}

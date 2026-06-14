import { GoogleGenAI } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { Task, EvalResult, ChatMessage, MessageBlock } from './types.js';

export async function runEval(task: Task, serverUrl: string): Promise<EvalResult> {
  const transport = new SSEClientTransport(new URL(serverUrl));
  const mcpClient = new Client(
    {
      name: 'eval-harness-client',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const ai = new GoogleGenAI({ apiKey });
  const transcript: ChatMessage[] = [];
  const errors: string[] = [];
  let steps = 0;

  try {
    // 1. Connect to MCP server
    await mcpClient.connect(transport);

    // 2. Fetch tools and map to Gemini API format
    const toolsResult = await mcpClient.listTools();

    // Recursive helper to ensure all 'array' types have an 'items' schema to satisfy Gemini API requirements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function fixGeminiSchema(schema: any): any {
      if (!schema || typeof schema !== 'object') {
        return schema;
      }
      if (Array.isArray(schema)) {
        return schema.map(fixGeminiSchema);
      }
      const result = { ...schema };
      if (result.type === 'array' && !result.items) {
        result.items = { type: 'object' };
      }
      for (const key of Object.keys(result)) {
        if (key === 'properties' && result[key] && typeof result[key] === 'object') {
          const props = { ...result[key] };
          for (const propName of Object.keys(props)) {
            props[propName] = fixGeminiSchema(props[propName]);
          }
          result[key] = props;
        } else if (typeof result[key] === 'object') {
          result[key] = fixGeminiSchema(result[key]);
        }
      }
      return result;
    }

    const geminiTools = toolsResult.tools.map((tool) => ({
      name: tool.name,
      description: tool.description || '',
      parameters: fixGeminiSchema(tool.inputSchema) as Record<string, unknown>,
    }));

    // 3. Interpolate environment variables in the description
    let description = task.description;
    const matches = description.match(/\{\{([A-Z0-9_]+)\}\}/g);
    if (matches) {
      for (const match of matches) {
        const envVarName = match.substring(2, match.length - 2);
        const envVarValue = process.env[envVarName] || '';
        description = description.replace(match, envVarValue);
      }
    }

    // Initialize Gemini history with user prompt
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const geminiHistory: any[] = [
      {
        role: 'user',
        parts: [{ text: description }],
      },
    ];

    transcript.push({
      role: 'user',
      content: description,
    });

    let conversationEnded = false;

    // 4. Conversation loop
    while (steps < task.max_steps && !conversationEnded) {
      // Proactive 4-second delay to guarantee we stay under the 15 RPM (1 request per 4s) Gemini Free Tier rate limit
      await new Promise((resolve) => setTimeout(resolve, 4000));

      let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
      let retries = 8;
      let delayMs = 2000;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: geminiHistory,
            config: {
              systemInstruction:
                'You are a helpful assistant with access to tools. Perform the requested task. Be concise and precise. Follow all tool requirements exactly.',
              tools: [{ functionDeclarations: geminiTools }],
            },
          });
          break;
        } catch (error: unknown) {
          const errMsg = error instanceof Error ? error.message : String(error);
          const status = (error as { status?: string })?.status;
          const isRateLimit =
            status === 'RESOURCE_EXHAUSTED' ||
            errMsg.includes('429') ||
            errMsg.includes('quota') ||
            errMsg.includes('503') ||
            status === 'UNAVAILABLE';
          if (isRateLimit && retries > 1) {
            console.log(
              `[Rate Limit / Busy] Gemini API returned error: ${errMsg}. Retrying in ${delayMs / 1000}s...`,
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            retries--;
            delayMs *= 2.5; // Exponential backoff
          } else {
            throw error;
          }
        }
      }

      if (!response) {
        throw new Error('Failed to retrieve response from Gemini API');
      }

      steps++;

      const candidate = response.candidates?.[0];
      const content = candidate?.content;
      const parts = content?.parts || [];

      // Append response to Gemini history
      geminiHistory.push({
        role: 'model',
        parts: parts,
      });

      // Extract function calls from response
      const functionCalls = response.functionCalls || [];

      // Generate matching unique IDs for transcript mapping
      const toolCallIds = functionCalls.map(
        (call: { name?: string }, idx: number) => `${call.name || ''}_${steps}_${idx}`,
      );

      // Map response parts to ChatMessage format for verification
      const transcriptParts: MessageBlock[] = [];
      let callIdx = 0;
      for (const part of parts) {
        if (part.text) {
          transcriptParts.push({ type: 'text', text: part.text });
        }
        if (part.functionCall) {
          transcriptParts.push({
            type: 'tool_use',
            id: toolCallIds[callIdx++] || '',
            name: part.functionCall.name || '',
            input: part.functionCall.args as Record<string, unknown>,
          });
        }
      }

      transcript.push({
        role: 'assistant',
        content: transcriptParts,
      });

      if (functionCalls.length === 0) {
        conversationEnded = true;
        break;
      }

      // Execute tool calls via MCP client
      const toolResults = await Promise.all(
        functionCalls.map(async (call: { name?: string; args?: unknown }, idx: number) => {
          const callId = toolCallIds[idx] || '';
          const toolName = call.name || '';
          try {
            const result = await mcpClient.callTool({
              name: toolName,
              arguments: call.args as Record<string, unknown>,
            });

            const contentVal = result.content as Array<{ type: 'text'; text: string }>;
            const textResult = contentVal.map((c) => c.text).join('\n');

            return {
              part: {
                functionResponse: {
                  name: toolName,
                  response: {
                    output: textResult,
                  },
                },
              },
              transcriptBlock: {
                type: 'tool_result' as const,
                tool_use_id: callId,
                content: contentVal,
              },
            };
          } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            errors.push(`Tool execution error for '${toolName}': ${errMsg}`);

            return {
              part: {
                functionResponse: {
                  name: toolName,
                  response: {
                    error: errMsg,
                  },
                },
              },
              transcriptBlock: {
                type: 'tool_result' as const,
                tool_use_id: callId,
                content: [{ type: 'text' as const, text: `Error: ${errMsg}` }],
                is_error: true,
              },
            };
          }
        }),
      );

      // Append tool responses to Gemini history
      geminiHistory.push({
        role: 'user',
        parts: toolResults.map((r) => r.part),
      });

      // Append tool responses to generic transcript
      transcript.push({
        role: 'user',
        content: toolResults.map((r) => r.transcriptBlock),
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

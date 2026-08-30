import Groq from "groq-sdk";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "groq-sdk/resources/chat/completions";

import { getModelId } from "@/lib/ai/model";
import type { AssistantProvider, ToolCallRecord } from "@/lib/ai/provider";
import { ASSISTANT_TOOLS } from "@/lib/ai/tools";

const MAX_ITERATIONS = 6;

let client: Groq | null = null;

function getClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY não está configurada — o assistente de IA ainda não pode responder.");
  }
  client ??= new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

const GROQ_TOOLS: ChatCompletionTool[] = ASSISTANT_TOOLS.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  },
}));

/**
 * Manual tool-use loop mirroring providers/anthropic.ts, adapted to Groq's
 * OpenAI-compatible chat-completions wire format: system prompt is a message
 * in the array (not a top-level param), and tool_calls[].function.arguments
 * arrives as a JSON string — unlike Anthropic's already-parsed tool_use.input
 * — so it must be JSON.parse'd before reaching the shared executeTool.
 */
export const generateReplyWithGroq: AssistantProvider = async (systemPrompt, history, executeTool) => {
  const groq = getClient();
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history.map((message) => ({ role: message.role, content: message.content }) as ChatCompletionMessageParam),
  ];
  const toolCalls: ToolCallRecord[] = [];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await groq.chat.completions.create({
      model: getModelId(),
      messages,
      tools: GROQ_TOOLS,
    });

    const message = response.choices[0]?.message;
    if (!message) {
      break;
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
      return { text: message.content ?? "", toolCalls };
    }

    messages.push({
      role: "assistant",
      content: message.content,
      tool_calls: message.tool_calls,
    });

    for (const toolCall of message.tool_calls) {
      let result: unknown;
      let input: unknown;
      try {
        input = JSON.parse(toolCall.function.arguments) as unknown;
        result = await executeTool(toolCall.function.name, input);
      } catch (error) {
        result = { error: error instanceof Error ? error.message : "Erro desconhecido" };
      }
      toolCalls.push({ name: toolCall.function.name, input, result });
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    text: "Não consegui concluir isso em uma única resposta — pode tentar de novo com um pedido mais específico?",
    toolCalls,
  };
};

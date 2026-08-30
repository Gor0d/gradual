import type { ToolExecutor } from "@/lib/ai/tool-executor";

/** Provider-neutral shapes — no Anthropic or OpenAI/Groq SDK types leak past the adapters. */

export type AssistantMessage = { role: "user" | "assistant"; content: string };

export type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
};

export type ToolCallRecord = { name: string; input: unknown; result: unknown };

export type GeneratedReply = { text: string; toolCalls: ToolCallRecord[] };

export type AssistantProvider = (
  systemPrompt: string,
  history: AssistantMessage[],
  executeTool: ToolExecutor,
) => Promise<GeneratedReply>;

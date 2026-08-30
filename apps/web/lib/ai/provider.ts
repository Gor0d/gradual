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

/**
 * Thrown by an adapter when the provider call itself fails (network, auth,
 * rate limit) mid-loop — carries whatever tools already ran (and already
 * mutated data) before the failure, so the dispatcher can report them
 * instead of silently dropping the record of a mutation that did happen.
 */
export class AssistantProviderError extends Error {
  toolCalls: ToolCallRecord[];

  constructor(message: string, toolCalls: ToolCallRecord[], options?: ErrorOptions) {
    super(message, options);
    this.name = "AssistantProviderError";
    this.toolCalls = toolCalls;
  }
}

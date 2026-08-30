import { getProviderName } from "@/lib/ai/model";
import { AssistantProviderError, type AssistantMessage, type GeneratedReply } from "@/lib/ai/provider";
import { generateReplyWithAnthropic } from "@/lib/ai/providers/anthropic";
import { generateReplyWithGroq } from "@/lib/ai/providers/groq";
import type { ToolExecutor } from "@/lib/ai/tool-executor";

export type { ToolCallRecord, GeneratedReply } from "@/lib/ai/provider";

/**
 * Thin dispatcher over the neutral AssistantProvider interface — swapping
 * providers is an env var (AI_PROVIDER), never a call-site change. Provider
 * SDK errors (rate limits, auth, network) are never surfaced to the UI: they
 * are logged here and replaced with a generic message so the chat never
 * leaks vendor-specific error text to the user. If a tool already mutated
 * data before the provider call that follows it failed, that tool call is
 * still returned (AssistantProviderError carries it) instead of silently
 * dropped — the mutation happened, so the record of it should too.
 */
export async function generateAssistantReply(
  systemPrompt: string,
  history: AssistantMessage[],
  executeTool: ToolExecutor,
): Promise<GeneratedReply> {
  try {
    const provider = getProviderName() === "anthropic" ? generateReplyWithAnthropic : generateReplyWithGroq;
    return await provider(systemPrompt, history, executeTool);
  } catch (error) {
    console.error("[ai] falha ao gerar resposta do assistente:", error);
    return {
      text: "O assistente está indisponível no momento. Tente novamente em instantes.",
      toolCalls: error instanceof AssistantProviderError ? error.toolCalls : [],
    };
  }
}

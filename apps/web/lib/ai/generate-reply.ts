import Anthropic from "@anthropic-ai/sdk";

import { ASSISTANT_MODEL } from "@/lib/ai/model";
import { ASSISTANT_TOOLS } from "@/lib/ai/tools";
import type { ToolExecutor } from "@/lib/ai/tool-executor";

const MAX_ITERATIONS = 6;

export type ToolCallRecord = { name: string; input: unknown; result: unknown };

export type GeneratedReply = {
  text: string;
  toolCalls: ToolCallRecord[];
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error(
      "ANTHROPIC_API_KEY não está configurada — o assistente de IA ainda não pode responder.",
    );
  }
  client ??= new Anthropic();
  return client;
}

/**
 * Manual tool-use loop (not the SDK's beta tool runner) — this is a
 * production Server Action, and the runner is still beta. Executes at most
 * MAX_ITERATIONS round-trips so a confused model can't loop forever.
 */
export async function generateAssistantReply(
  systemPrompt: string,
  history: Anthropic.MessageParam[],
  executeTool: ToolExecutor,
): Promise<GeneratedReply> {
  const anthropic = getClient();
  const messages: Anthropic.MessageParam[] = [...history];
  const toolCalls: ToolCallRecord[] = [];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await anthropic.messages.create({
      model: ASSISTANT_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      tools: ASSISTANT_TOOLS,
      messages,
    });

    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }

    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUseBlocks.length === 0) {
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text",
      );
      return { text: textBlock?.text ?? "", toolCalls };
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      let result: unknown;
      try {
        result = await executeTool(block.name, block.input);
      } catch (error) {
        result = { error: error instanceof Error ? error.message : "Erro desconhecido" };
      }
      toolCalls.push({ name: block.name, input: block.input, result });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return {
    text: "Não consegui concluir isso em uma única resposta — pode tentar de novo com um pedido mais específico?",
    toolCalls,
  };
}

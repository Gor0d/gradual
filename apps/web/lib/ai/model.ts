/**
 * Provider/model choice is env-driven so comparing Groq vs. Anthropic (and
 * later, local models) never requires touching a caller — only .env.local.
 * Groq is the development default: fast and free for iterating on the tool
 * loop; Anthropic stays available as an opt-in adapter (AI_PROVIDER=anthropic).
 */
export function getProviderName(): "groq" | "anthropic" {
  return process.env.AI_PROVIDER === "anthropic" ? "anthropic" : "groq";
}

const DEFAULT_MODEL_BY_PROVIDER = {
  groq: "openai/gpt-oss-20b",
  anthropic: "claude-opus-5",
} as const;

export function getModelId(): string {
  return process.env.AI_MODEL ?? DEFAULT_MODEL_BY_PROVIDER[getProviderName()];
}

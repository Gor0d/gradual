const PROVIDERS = ["groq", "anthropic"] as const;
export type ProviderName = (typeof PROVIDERS)[number];

/**
 * Provider/model choice is env-driven so comparing Groq vs. Anthropic (and
 * later, local models) never requires touching a caller — only .env.local.
 * Groq is the development default: fast and free for iterating on the tool
 * loop; Anthropic stays available as an opt-in adapter (AI_PROVIDER=anthropic).
 * An unrecognized AI_PROVIDER fails loudly instead of silently falling back
 * to Groq — a typo here should never send traffic to the wrong vendor.
 */
export function getProviderName(): ProviderName {
  const value = process.env.AI_PROVIDER ?? "groq";
  if (!PROVIDERS.includes(value as ProviderName)) {
    throw new Error(`AI_PROVIDER inválido: "${value}". Use um de: ${PROVIDERS.join(", ")}.`);
  }
  return value as ProviderName;
}

const DEFAULT_MODEL_BY_PROVIDER: Record<ProviderName, string> = {
  groq: "openai/gpt-oss-20b",
  anthropic: "claude-opus-5",
};

// Each provider reads its own model env var — GROQ_MODEL vs. ANTHROPIC_MODEL,
// not a shared AI_MODEL — so flipping AI_PROVIDER never sends one vendor's
// model id to the other's API.
const MODEL_ENV_BY_PROVIDER: Record<ProviderName, string> = {
  groq: "GROQ_MODEL",
  anthropic: "ANTHROPIC_MODEL",
};

export function getModelId(): string {
  const provider = getProviderName();
  return process.env[MODEL_ENV_BY_PROVIDER[provider]] ?? DEFAULT_MODEL_BY_PROVIDER[provider];
}

/**
 * Model/provider choice is still under discussion between the user and
 * Codex (comparing hosted Claude models against local/self-hosted
 * alternatives) — kept as a single env-driven constant so settling on one
 * never requires touching this file's callers. Defaults to Claude Opus 5
 * per Anthropic's own guidance (don't downgrade for cost without an
 * explicit decision to do so).
 */
export const ASSISTANT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5";

/**
 * Shared helpers for working with Anthropic Claude models across providers
 * (direct Anthropic API, AWS Bedrock, Google Vertex AI, etc.).
 *
 * Different providers expose Claude with different name conventions:
 *   - Anthropic API:   "claude-opus-4-7"
 *   - AWS Bedrock:     "anthropic.claude-opus-4-7-v1", "us.anthropic.claude-opus-4-7-..."
 *   - Vertex AI:       "claude-opus-4-7", "claude-opus-4-7@20251015"
 *
 * The regex patterns below intentionally match only the version-bearing
 * portion of the name so they work across all of the above.
 */

// Claude 5 and later, plus Mythos Preview, use adaptive thinking by default.
// Match the version inside provider-prefixed or dated IDs as well.
export const DEFAULT_ADAPTIVE_THINKING_MODEL = /\bclaude-(?:(?:opus|sonnet|haiku|fable|mythos)-(?:[5-9]|\d{2,})\b|mythos-preview\b)/

/** Model name patterns that do not accept custom temperature, top_p or top_k. */
export const MODELS_WITHOUT_SAMPLING_PARAMS: RegExp[] = [/opus-4-[7-9](?:\b|-)/, /opus-(?:[5-9]|\d{2,})-/]

/**
 * Returns false when the given model name matches any pattern in
 * `MODELS_WITHOUT_SAMPLING_PARAMS`. Callers should skip setting
 * `temperature`, `topP`, and `topK` when this returns false.
 */
export const supportsSamplingParams = (modelName?: string): boolean => {
    if (!modelName) return true
    return !MODELS_WITHOUT_SAMPLING_PARAMS.some((pattern) => pattern.test(modelName))
}

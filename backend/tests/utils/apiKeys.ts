/**
 * API Key Utilities for Testing
 *
 * Provides helpers for checking API key availability and selecting providers
 * for integration testing.
 */

/**
 * Check if API keys are available for integration testing
 *
 * @returns True if ANTHROPIC_API_KEY or CLAUDE_CODE_OAUTH_TOKEN is set
 *
 * @example
 * ```typescript
 * import { hasApiKeys } from '../utils/apiKeys.js';
 *
 * it.skipIf(!hasApiKeys())('should call LLM API', async () => {
 *   // Test only runs if API keys available
 * });
 * ```
 */
export const hasApiKeys = (): boolean => {
  return !!(
    process.env.ANTHROPIC_API_KEY ||
    process.env.CLAUDE_CODE_OAUTH_TOKEN
  );
};

/**
 * Get available LLM provider for testing
 *
 * Prioritizes Claude Code OAuth token over Anthropic API key.
 *
 * @returns Provider name ('claude-code' or 'anthropic')
 * @throws Error if no API keys available
 *
 * @example
 * ```typescript
 * const provider = getTestProvider();
 * const config = { provider, model: 'claude-sonnet-4-5' };
 * ```
 */
export const getTestProvider = (): string => {
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) return 'claude-code';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  throw new Error('No API keys available for testing. Set CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY.');
};

/**
 * Check if specific provider is available
 *
 * @param provider Provider name to check
 * @returns True if provider's API key is available
 *
 * @example
 * ```typescript
 * if (hasProviderKey('openai')) {
 *   // Run OpenAI-specific tests
 * }
 * ```
 */
export const hasProviderKey = (provider: string): boolean => {
  switch (provider) {
    case 'claude-code':
      return !!process.env.CLAUDE_CODE_OAUTH_TOKEN;
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'zhipu':
      return !!process.env.ZHIPU_API_KEY;
    default:
      return false;
  }
};

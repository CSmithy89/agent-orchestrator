# LLM Provider Patterns: OAuth Authentication Guide

**Date**: 2025-11-10
**Status**: Canonical Reference for Agent Implementation
**Context**: Epic 2 Retrospective Action Item #9

---

## Overview

This document defines the **required patterns** for LLM provider configuration in the Agent Orchestrator system. The system is designed to use **OAuth token authentication** with Claude Code, not traditional API key authentication.

**Critical Rule**: All agent implementations, tests, and documentation examples **must** use the `'claude-code'` provider for Claude Code authentication.

---

## Why OAuth Authentication?

### Design Decision

The Agent Orchestrator was architected from the beginning to support **Claude Code subscription-based authentication** using OAuth tokens:

- **OAuth Tokens**: Format `sk-ant-oat01-*` (Claude Code subscription)
- **API Keys**: Format `sk-ant-api01-*` (Direct Anthropic API)

Claude Code provides OAuth tokens for subscription-based access, which require special SDK support.

### Authentication Methods Comparison

| Authentication Type | Token Format | SDK Required | Use Case |
|-------------------|--------------|--------------|----------|
| **OAuth Token** (Required) | `sk-ant-oat01-*` | `@anthropic-ai/claude-agent-sdk` | Claude Code subscription |
| **API Key** (Not Used) | `sk-ant-api01-*` | `@anthropic-ai/sdk` | Direct Anthropic API billing |

**Our System Uses**: OAuth Token → `@anthropic-ai/claude-agent-sdk` → `'claude-code'` provider

---

## SDK Differences

### `@anthropic-ai/claude-agent-sdk` (OAuth Support) ✅

**Use this SDK** - Supports OAuth token authentication:

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

const agent = new Agent({
  apiKey: process.env.CLAUDE_CODE_OAUTH_TOKEN, // sk-ant-oat01-*
  // ... other config
});
```

**Features**:
- Supports OAuth tokens (`sk-ant-oat01-*`)
- Returns nested message structure: `msg.message.content[].text`
- Used by `ClaudeCodeProvider` in our system

### `@anthropic-ai/sdk` (API Key Only) ❌

**Do NOT use this SDK** - Only supports API key authentication:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // sk-ant-api01-* only
});
```

**Limitations**:
- Only supports API keys (`sk-ant-api01-*`)
- **Does NOT support OAuth tokens** → Will fail with 401 authentication error
- Not compatible with Claude Code subscriptions

---

## Provider Configuration Rules

### Rule 1: Use 'claude-code' Provider for Agents

**All agent implementations must use `provider: 'claude-code'`**:

```typescript
// ✅ CORRECT - Use 'claude-code' provider
const llmConfig: LLMConfig = {
  provider: 'claude-code',  // OAuth-compatible
  model: 'claude-sonnet-4-5',
  temperature: 0.3,
  maxTokens: 4000
};

const mary = await MaryAgent.create(
  llmConfig,
  llmFactory,
  decisionEngine,
  escalationQueue
);
```

```typescript
// ❌ INCORRECT - Do NOT use 'anthropic' provider
const llmConfig: LLMConfig = {
  provider: 'anthropic',  // API key only, won't work with OAuth
  model: 'claude-sonnet-4-5',
  temperature: 0.3,
  maxTokens: 4000
};
```

### Rule 2: JSDoc Examples Must Show 'claude-code'

**All documentation examples must use `'claude-code'`**:

```typescript
/**
 * Create a new MaryAgent instance
 *
 * @example
 * ```typescript
 * // ✅ CORRECT
 * const mary = await MaryAgent.create(
 *   { provider: 'claude-code', model: 'claude-sonnet-4-5', temperature: 0.3 },
 *   llmFactory,
 *   decisionEngine,
 *   escalationQueue
 * );
 * ```
 */
```

### Rule 3: Test Configurations Must Use 'claude-code'

**All integration tests must use `'claude-code'`**:

```typescript
// ✅ CORRECT
describe('MaryAgent Integration Tests', () => {
  it('should work with Claude Code provider', async () => {
    const config: LLMConfig = {
      provider: 'claude-code',  // OAuth-compatible
      model: 'claude-sonnet-4-5',
      temperature: 0.3,
      maxTokens: 4000
    };

    const mary = await MaryAgent.create(config, llmFactory);
    // ... test assertions
  });
});
```

---

## When to Use Each Provider

### 'claude-code' Provider (Required for Agents)

**Use for**:
- All agent implementations (Mary, John, Winston, Murat, etc.)
- DecisionEngine LLM reasoning
- Integration tests with real LLM calls
- Development with Claude Code subscriptions

**Configuration**:
```typescript
{
  provider: 'claude-code',
  model: 'claude-sonnet-4-5',
  // ... other options
}
```

**Environment Variable**:
```bash
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
```

### 'anthropic' Provider (Internal Model Definitions Only)

**Use ONLY for**:
- Internal model tier definitions in `CostQualityOptimizer`
- Model pricing and capability metadata
- **NOT for agent configurations or examples**

**Example** (from `CostQualityOptimizer.ts`):
```typescript
// Internal model definitions - NOT for agent config
private static readonly MODEL_TIERS = {
  high: [
    { provider: 'anthropic', model: 'claude-opus-4', costPer1kTokens: 0.03 },
    // ^ This is metadata about Anthropic's models, not a usage configuration
  ]
};
```

**Why this is acceptable**: The 'anthropic' reference here is describing the actual model provider for pricing/capabilities, not configuring authentication.

### Other Providers (Future)

The system supports additional providers through `LLMFactory`:
- `'openai'` → OpenAIProvider (GPT models)
- `'zhipu'` → ZhipuProvider (GLM models)

These are available for future use but not the primary focus.

---

## Common Pitfalls and How to Avoid Them

### Pitfall 1: Copying Old Documentation Examples

**Problem**: Developer sees old documentation with `provider: 'anthropic'` and copies it.

**Solution**: All JSDoc examples updated to use `'claude-code'` (Epic 2, commit f2012e6).

**Prevention**: Code review checklist includes "Does this use 'claude-code' provider?"

### Pitfall 2: Using Wrong SDK

**Problem**: Developer imports `@anthropic-ai/sdk` instead of `@anthropic-ai/claude-agent-sdk`.

**Solution**: `ClaudeCodeProvider` implementation uses correct SDK.

**Prevention**: Provider abstraction hides SDK details from agents.

### Pitfall 3: Mixing Authentication Types

**Problem**: Developer tries to use API key (`sk-ant-api01-*`) with `'claude-code'` provider.

**Error**:
```
Error: Anthropic authentication failed: 401
{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}
```

**Solution**: Use OAuth token (`sk-ant-oat01-*`) from Claude Code subscription.

**Prevention**: Clear documentation of required token format.

### Pitfall 4: Test Configuration Mismatch

**Problem**: Unit tests use mocked providers but integration tests use wrong provider.

**Solution**:
- Unit tests: Mock `LLMFactory.createClient()` → No real provider needed
- Integration tests: Use `'claude-code'` provider with real OAuth token

**Example**:
```typescript
// Unit test - mocked
const mockLLMFactory = {
  createClient: vi.fn().mockResolvedValue(mockClient)
};

// Integration test - real provider
const realLLMFactory = new LLMFactory();
realLLMFactory.registerProvider('claude-code', new ClaudeCodeProvider());
const config = { provider: 'claude-code', model: 'claude-sonnet-4-5' };
```

---

## Code Review Checklist

When reviewing agent implementations, verify:

- [ ] **Agent configuration uses `'claude-code'` provider**
  - Check `LLMConfig` objects
  - Check agent initialization code
  - Check test configurations

- [ ] **JSDoc examples show `'claude-code'` provider**
  - Check class-level documentation
  - Check method-level documentation
  - Check example code blocks

- [ ] **Tests use correct provider**
  - Unit tests: Can use mocked providers
  - Integration tests: Must use `'claude-code'` provider
  - No tests use `'anthropic'` provider for agent configuration

- [ ] **Environment variables documented**
  - CLAUDE_CODE_OAUTH_TOKEN for OAuth authentication
  - Token format: `sk-ant-oat01-*`

- [ ] **Error handling for authentication failures**
  - 401 errors logged clearly
  - User guidance on checking token format

---

## Definition of Done for Agent Stories

Every story that implements or modifies an agent MUST:

1. **Use `'claude-code'` provider** in all LLM configurations
2. **Show `'claude-code'` provider** in all JSDoc examples
3. **Pass integration tests** with real `'claude-code'` provider
4. **Include code review** verification of OAuth pattern compliance
5. **Document environment variables** (CLAUDE_CODE_OAUTH_TOKEN)

---

## Examples: Correct Usage

### Mary Agent (Business Analyst)

```typescript
/**
 * Create a new MaryAgent instance
 *
 * @example
 * ```typescript
 * const mary = await MaryAgent.create(
 *   {
 *     provider: 'claude-code',  // ✅ OAuth-compatible
 *     model: 'claude-sonnet-4-5',
 *     temperature: 0.3
 *   },
 *   llmFactory,
 *   decisionEngine,
 *   escalationQueue
 * );
 * ```
 */
export class MaryAgent {
  // Implementation...
}
```

### John Agent (Product Manager)

```typescript
/**
 * Create a new JohnAgent instance
 *
 * @example
 * ```typescript
 * const john = await JohnAgent.create(
 *   {
 *     provider: 'claude-code',  // ✅ OAuth-compatible
 *     model: 'claude-sonnet-4-5',
 *     temperature: 0.5
 *   },
 *   llmFactory,
 *   decisionEngine,
 *   escalationQueue
 * );
 * ```
 */
export class JohnAgent {
  // Implementation...
}
```

### DecisionEngine

```typescript
/**
 * Create a new DecisionEngine
 *
 * @example
 * ```typescript
 * const engine = new DecisionEngine(llmFactory, {
 *   provider: 'claude-code',  // ✅ OAuth-compatible
 *   model: 'claude-sonnet-4-5'
 * });
 * ```
 */
export class DecisionEngine {
  // Implementation...
}
```

### Integration Test

```typescript
describe('MaryAgent Integration Tests', () => {
  it('should work with Claude Code provider', async () => {
    const llmFactory = new LLMFactory();
    llmFactory.registerProvider('claude-code', new ClaudeCodeProvider());

    const config: LLMConfig = {
      provider: 'claude-code',  // ✅ OAuth-compatible
      model: 'claude-sonnet-4-5',
      temperature: 0.3,
      maxTokens: 4000
    };

    const mary = await MaryAgent.create(config, llmFactory);
    const result = await mary.analyzeRequirements('Build user authentication');

    expect(result.requirements).toBeDefined();
  });
});
```

---

## Troubleshooting

### Authentication Error (401)

**Error**:
```
Error: Anthropic authentication failed: 401
{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}
```

**Causes**:
1. Using API key (`sk-ant-api01-*`) instead of OAuth token (`sk-ant-oat01-*`)
2. Using `'anthropic'` provider instead of `'claude-code'` provider
3. Missing or invalid `CLAUDE_CODE_OAUTH_TOKEN` environment variable

**Solutions**:
1. Verify token format: `sk-ant-oat01-*` (OAuth token)
2. Verify provider configuration: `provider: 'claude-code'`
3. Check environment variable: `echo $CLAUDE_CODE_OAUTH_TOKEN`

### Provider Not Found

**Error**:
```
Error: Provider 'claude-code' not registered
```

**Cause**: `ClaudeCodeProvider` not registered with `LLMFactory`

**Solution**:
```typescript
const llmFactory = new LLMFactory();
llmFactory.registerProvider('claude-code', new ClaudeCodeProvider());
```

### Response Parsing Error

**Error**:
```
TypeError: Cannot read property 'text' of undefined
```

**Cause**: Using wrong response structure for Claude Agent SDK

**Solution**: `ClaudeCodeProvider` handles response extraction:
```typescript
const textContent = messages
  .filter(msg => msg.type === 'assistant')
  .map(msg => msg.message?.content
    ?.filter((c: any) => c.type === 'text')
    ?.map((c: any) => c.text || '')
    ?.join('\n') || ''
  )
  .join('\n');
```

---

## References

- **Epic 2 Retrospective**: `docs/retrospective-epic-2.md` (Action Item #9)
- **Commit f2012e6**: Updated documentation examples to use 'claude-code' provider
- **Commit 759283d**: Added OAuth authentication pattern learning to retrospective
- **ClaudeCodeProvider**: `backend/src/llm/providers/ClaudeCodeProvider.ts`
- **LLMFactory**: `backend/src/llm/LLMFactory.ts`
- **Type Definitions**: `backend/src/types/llm.types.ts`

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-10 | 1.0 | Initial documentation (Epic 2 Action Item #9) |

---

**Maintained by**: Architecture Team (Winston)
**Next Review**: Before Epic 3 Story 3.1 (Winston/Murat agent implementation)

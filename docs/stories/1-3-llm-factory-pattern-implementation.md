# Story 1.3: LLM Factory Pattern Implementation

Status: ready-for-dev

## Story

As an agent system developer,
I want a factory that creates LLM clients for different providers,
So that agents can be assigned optimal models per project configuration.

## Acceptance Criteria

1. ✅ Implement LLMFactory class with provider registry
2. ✅ Support Anthropic provider (Claude Sonnet, Claude Haiku):
   - Check for `CLAUDE_CODE_OAUTH_TOKEN` first (subscription auth - preferred)
   - Fallback to `ANTHROPIC_API_KEY` if OAuth token not present (pay-per-use)
   - Support `base_url` parameter in LLMConfig for Anthropic-compatible wrappers (e.g., z.ai for GLM)
   - LLMConfig interface: `{ model: string, provider: string, base_url?: string, api_key?: string }`
3. ✅ Support OpenAI provider (GPT-4, GPT-4 Turbo, Codex):
   - Load `OPENAI_API_KEY` from environment
   - Support models: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo-instruct` (Codex replacement)
4. ✅ Support Zhipu provider (GLM-4, GLM-4.6):
   - Load `ZHIPU_API_KEY` from environment
   - Native Zhipu API integration for GLM models
   - Alternative to z.ai wrapper approach for GLM access
5. ✅ (Optional) Support Google provider (Gemini):
   - Load `GOOGLE_API_KEY` from environment
   - Integrate `@google/generative-ai` SDK
   - Support `gemini-1.5-pro`, `gemini-2.0-flash` models
   - Can be deferred to future story if time-constrained
6. ✅ Provider factory registration in constructor:
   ```typescript
   this.providers.set('anthropic', new AnthropicProvider());
   this.providers.set('openai', new OpenAIProvider());
   this.providers.set('zhipu', new ZhipuProvider());
   // this.providers.set('google', new GoogleProvider()); // Optional
   ```
7. ✅ Validate model names for each provider:
   - Anthropic: `claude-sonnet-4-5`, `claude-haiku`, `GLM-4.6` (via base_url wrapper)
   - OpenAI: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo-instruct`
   - Zhipu: `GLM-4`, `GLM-4.6`
   - Google: `gemini-1.5-pro`, `gemini-2.0-flash` (if implemented)
8. ✅ Create LLMClient interface with `invoke()` and `stream()` methods
9. ✅ Include retry logic with exponential backoff for API failures
10. ✅ Log all LLM requests/responses for debugging (exclude sensitive keys)
11. ✅ Support per-agent LLM configuration via `.bmad/project-config.yaml`:
    ```yaml
    agent_assignments:
      amelia:
        model: "gpt-4-turbo"
        provider: "openai"
      winston:
        model: "GLM-4.6"
        provider: "anthropic"  # Using z.ai wrapper
        base_url: "https://api.z.ai/api/anthropic"
        api_key: "${ZAI_API_KEY}"
    ```

## Tasks / Subtasks

- [ ] **Task 1**: Implement LLMFactory class structure (AC: #1, #6)
  - [ ] Create `backend/src/llm/LLMFactory.ts`
  - [ ] Define provider registry: `Map<string, LLMProvider>`
  - [ ] Implement `registerProvider(name: string, provider: LLMProvider): void` method
  - [ ] Implement `createClient(config: LLMConfig): LLMClient` method
  - [ ] Register default providers in constructor (Anthropic, OpenAI, Zhipu)
  - [ ] Throw errors if unknown provider requested
  - [ ] Support provider-specific configuration (base_url, api_key overrides)

- [ ] **Task 2**: Define LLMClient interface and types (AC: #8)
  - [ ] Create `backend/src/llm/LLMClient.interface.ts`
  - [ ] Define `LLMClient` interface with methods:
    - `invoke(prompt: string, options?: InvokeOptions): Promise<string>`
    - `stream(prompt: string, options?: StreamOptions): AsyncIterator<string>`
    - `estimateCost(prompt: string, response: string): number`
  - [ ] Create `backend/src/types/llm.types.ts` with:
    - `LLMConfig`: { model, provider, base_url?, api_key?, reasoning }
    - `InvokeOptions`: { temperature?, max_tokens?, system_prompt? }
    - `StreamOptions`: { temperature?, max_tokens? }
  - [ ] Export all interfaces for use by providers

- [ ] **Task 3**: Implement Anthropic Provider (AC: #2)
  - [ ] Create `backend/src/llm/providers/AnthropicProvider.ts`
  - [ ] Install `@anthropic-ai/sdk` ^0.20.0
  - [ ] Implement OAuth token priority:
    - Check `CLAUDE_CODE_OAUTH_TOKEN` environment variable first
    - Fallback to `ANTHROPIC_API_KEY` if OAuth token not present
  - [ ] Support `base_url` parameter for Anthropic-compatible wrappers (e.g., z.ai)
  - [ ] Implement `createClient(config: LLMConfig): LLMClient` method
  - [ ] Map model names: `claude-sonnet-4-5`, `claude-haiku`, `GLM-4.6` (via wrapper)
  - [ ] Implement `invoke()` method with Anthropic Messages API
  - [ ] Implement `stream()` method with SSE streaming
  - [ ] Implement `estimateCost()` using token pricing (input/output rates)

- [ ] **Task 4**: Implement OpenAI Provider (AC: #3)
  - [ ] Create `backend/src/llm/providers/OpenAIProvider.ts`
  - [ ] Install `openai` ^4.20.0
  - [ ] Load `OPENAI_API_KEY` from environment
  - [ ] Map model names: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo-instruct` (Codex replacement)
  - [ ] Implement `createClient(config: LLMConfig): LLMClient` method
  - [ ] Implement `invoke()` method with ChatCompletions API
  - [ ] Implement `stream()` method with streaming responses
  - [ ] Implement `estimateCost()` using GPT-4/GPT-3.5 token pricing

- [ ] **Task 5**: Implement Zhipu Provider (AC: #4)
  - [ ] Create `backend/src/llm/providers/ZhipuProvider.ts`
  - [ ] Load `ZHIPU_API_KEY` from environment
  - [ ] Implement native Zhipu API integration using HTTP client (axios/fetch)
  - [ ] Map model names: `GLM-4`, `GLM-4.6`
  - [ ] Implement `createClient(config: LLMConfig): LLMClient` method
  - [ ] Implement `invoke()` method with Zhipu API format
  - [ ] Implement `stream()` method if Zhipu supports streaming
  - [ ] Implement `estimateCost()` using GLM pricing (if available)
  - [ ] Handle authentication and request signing per Zhipu specs

- [ ] **Task 6**: (Optional) Implement Google Provider (AC: #5)
  - [ ] Create `backend/src/llm/providers/GoogleProvider.ts`
  - [ ] Install `@google/generative-ai` SDK
  - [ ] Load `GOOGLE_API_KEY` from environment
  - [ ] Map model names: `gemini-1.5-pro`, `gemini-2.0-flash`
  - [ ] Implement `createClient(config: LLMConfig): LLMClient` method
  - [ ] Implement `invoke()` and `stream()` methods
  - [ ] Implement `estimateCost()` using Gemini pricing
  - [ ] **Note**: Can be deferred if time-constrained, not blocking

- [ ] **Task 7**: Implement model validation (AC: #7)
  - [ ] Create `validateModel(model: string, provider: string): boolean` method in LLMFactory
  - [ ] Define allowed models per provider:
    - Anthropic: `claude-sonnet-4-5`, `claude-haiku`, `GLM-4.6` (wrapper)
    - OpenAI: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo-instruct`
    - Zhipu: `GLM-4`, `GLM-4.6`
    - Google: `gemini-1.5-pro`, `gemini-2.0-flash`
  - [ ] Throw `InvalidModelError` with helpful message if model invalid for provider
  - [ ] Include suggestions for valid models in error message

- [ ] **Task 8**: Implement retry logic and error handling (AC: #9)
  - [ ] Create `RetryHandler` utility class with exponential backoff
  - [ ] Implement backoff delays: [1s, 2s, 4s] for 3 retry attempts
  - [ ] Wrap all LLM API calls in retry logic
  - [ ] Classify errors:
    - Transient (rate limit, timeout): Retry with backoff
    - Auth errors (401, 403): No retry, escalate immediately
    - Permanent errors (400, invalid request): No retry, escalate
  - [ ] Log retry attempts with context (attempt number, delay, error)
  - [ ] After max retries, throw with clear error message

- [ ] **Task 9**: Implement request/response logging (AC: #10)
  - [ ] Create `LLMLogger` utility class
  - [ ] Log all requests with:
    - Provider, model, prompt (truncated if >500 chars), options, timestamp
  - [ ] Log all responses with:
    - Response text (truncated), token usage, estimated cost, latency
  - [ ] **Critical**: Exclude sensitive keys from logs (redact API keys, OAuth tokens)
  - [ ] Use structured logging (JSON format) for machine parsing
  - [ ] Include correlation IDs for request tracing
  - [ ] Log to `logs/llm-requests.log` (separate from application logs)

- [ ] **Task 10**: Integrate per-agent LLM configuration (AC: #11)
  - [ ] Load agent assignments from `.bmad/project-config.yaml` via ProjectConfig
  - [ ] Schema example:
    ```yaml
    agent_assignments:
      amelia:
        model: "gpt-4-turbo"
        provider: "openai"
        reasoning: "Best code generation capabilities"
      winston:
        model: "GLM-4.6"
        provider: "anthropic"  # Using z.ai wrapper
        base_url: "https://api.z.ai/api/anthropic"
        api_key: "${ZAI_API_KEY}"
        reasoning: "Cost-effective for architecture reasoning"
      mary:
        model: "claude-sonnet-4-5"
        provider: "anthropic"
        reasoning: "Strong requirements analysis"
    ```
  - [ ] Implement `getAgentLLMConfig(agentName: string): LLMConfig` in ProjectConfig
  - [ ] Throw error if agent not found in config
  - [ ] Support environment variable substitution in api_key field (e.g., `${ZAI_API_KEY}`)

- [ ] **Task 11**: Testing and integration
  - [ ] Write unit tests for LLMFactory class
  - [ ] Test provider registration and retrieval
  - [ ] Test client creation for each provider
  - [ ] Test model validation (valid and invalid models)
  - [ ] Test error handling and retry logic
  - [ ] Test request/response logging (verify API keys excluded)
  - [ ] Write integration tests with actual API calls (dev keys):
    - Test Anthropic OAuth token auth
    - Test Anthropic API key fallback
    - Test OpenAI API calls
    - Test Zhipu native API calls
    - Test base_url wrapper (z.ai for GLM)
  - [ ] Test per-agent configuration loading
  - [ ] Mock external LLM APIs in unit tests
  - [ ] Document LLMFactory API in code comments

## Dev Notes

### Architecture Context

This story implements the **LLM Factory** component from Epic 1 tech spec (Section 2.1.2). The factory is a critical infrastructure component that enables:

1. **Multi-Provider Support**: Abstracts differences between Anthropic, OpenAI, Zhipu, and Google APIs
2. **Cost-Quality Optimization**: Enables per-agent model selection (premium for complex tasks, economy for simple)
3. **Flexible Authentication**: Supports OAuth tokens (CLAUDE_CODE_OAUTH_TOKEN) and API keys with fallbacks
4. **Wrapper Support**: Base URL configuration allows using Anthropic-compatible wrappers (e.g., z.ai for GLM)
5. **Agent Pool Integration**: Agent pool uses factory to assign optimal LLMs per project configuration

**Key Design Decisions:**
- Factory pattern for extensibility (add providers without core changes)
- Provider registry allows dynamic provider registration
- LLMClient interface abstracts provider-specific APIs
- Retry logic with exponential backoff handles transient failures
- Request/response logging for debugging and cost tracking

[Source: docs/tech-spec-epic-1.md#LLM-Factory-Pattern]

### Tech Stack Alignment

**Backend Technology Stack:**
- Node.js ≥20.0.0 (ESM support)
- TypeScript ^5.0.0 (strict mode)
- Dependencies:
  - `@anthropic-ai/sdk` ^0.20.0 - Claude API (Sonnet, Haiku)
  - `openai` ^4.20.0 - OpenAI GPT-4/GPT-3.5/Codex
  - `axios` or native `fetch` - Zhipu GLM native API
  - (Optional) `@google/generative-ai` - Google Gemini models

**Authentication Strategy:**
- Anthropic: OAuth token (CLAUDE_CODE_OAUTH_TOKEN) preferred, API key (ANTHROPIC_API_KEY) fallback
- OpenAI: API key (OPENAI_API_KEY)
- Zhipu: API key (ZHIPU_API_KEY)
- z.ai wrapper: API key (ZAI_API_KEY) + base_url configuration
- Google: API key (GOOGLE_API_KEY) - optional

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Project Structure Notes

**Directory Structure:**
```
agent-orchestrator/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── ProjectConfig.ts       ← Story 1.1 (existing)
│   │   ├── llm/
│   │   │   ├── LLMFactory.ts          ← This story
│   │   │   ├── providers/
│   │   │   │   ├── AnthropicProvider.ts
│   │   │   │   ├── OpenAIProvider.ts
│   │   │   │   ├── ZhipuProvider.ts
│   │   │   │   └── GoogleProvider.ts  ← Optional
│   │   │   └── LLMClient.interface.ts
│   │   └── types/
│   │       └── llm.types.ts           ← Type definitions
│   ├── tests/
│   │   └── llm/
│   │       ├── LLMFactory.test.ts
│   │       └── providers/
│   │           ├── AnthropicProvider.test.ts
│   │           ├── OpenAIProvider.test.ts
│   │           └── ZhipuProvider.test.ts
│   └── package.json                    ← Update with LLM SDK dependencies
```

**Integration Points:**
- ProjectConfig class (Story 1.1) loads agent_assignments from `.bmad/project-config.yaml`
- Agent Pool (Story 1.4) uses LLMFactory to create agents with configured LLMs
- Cost-Quality Optimizer (Story 1.13) queries model capabilities and pricing

[Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts]

### LLMClient Interface

**LLMClient Schema** (from tech spec):
```typescript
interface LLMClient {
  provider: string;       // "anthropic", "openai", "zhipu", "google"
  model: string;          // e.g., "claude-sonnet-4-5", "gpt-4-turbo"
  invoke(prompt: string, options?: InvokeOptions): Promise<string>;
  stream(prompt: string, options?: StreamOptions): AsyncIterator<string>;
  estimateCost(prompt: string, response: string): number;
}

interface InvokeOptions {
  temperature?: number;     // 0-1, default 0.7
  max_tokens?: number;      // Max response tokens
  system_prompt?: string;   // System message for context
  stop_sequences?: string[]; // Stop generation at these strings
}

interface StreamOptions {
  temperature?: number;
  max_tokens?: number;
}

interface LLMConfig {
  model: string;
  provider: string;
  base_url?: string;        // For Anthropic-compatible wrappers
  api_key?: string;         // Override default API key
  reasoning?: string;       // Why this model/agent pairing
}
```

[Source: docs/tech-spec-epic-1.md#Data-Models-and-Contracts]

### Provider-Specific Implementation Notes

**Anthropic Provider:**
- **OAuth Token Priority**: Check `CLAUDE_CODE_OAUTH_TOKEN` first (subscription auth)
- **API Key Fallback**: Use `ANTHROPIC_API_KEY` if OAuth token not present
- **Wrapper Support**: Support `base_url` parameter for Anthropic-compatible APIs (e.g., z.ai for GLM)
- **Endpoint**: `https://api.anthropic.com/v1/messages` (or custom base_url)
- **Models**: `claude-sonnet-4-5`, `claude-haiku`
- **Cost**: Input $3/M tokens, Output $15/M tokens (Sonnet pricing)

**OpenAI Provider:**
- **Authentication**: `OPENAI_API_KEY` environment variable
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Models**: `gpt-4-turbo`, `gpt-4`, `gpt-3.5-turbo-instruct` (Codex replacement)
- **Cost**: GPT-4 Turbo $10/M input, $30/M output

**Zhipu Provider (Native):**
- **Authentication**: `ZHIPU_API_KEY` environment variable
- **Endpoint**: Zhipu native API (consult Zhipu docs for exact URL)
- **Models**: `GLM-4`, `GLM-4.6`
- **Implementation**: Use `axios` or native `fetch` with Zhipu-specific request format
- **Cost**: Consult Zhipu pricing (may be lower than Western providers)

**z.ai Wrapper (Anthropic-Compatible GLM Access):**
- **Authentication**: `ZAI_API_KEY` environment variable
- **Endpoint**: `https://api.z.ai/api/anthropic` (set as `base_url`)
- **Provider**: Use `anthropic` provider with `base_url` override
- **Model**: `GLM-4.6` (appears as Anthropic model to client)
- **Benefit**: Use same AnthropicProvider code with different endpoint

**Google Provider (Optional):**
- **Authentication**: `GOOGLE_API_KEY` environment variable
- **SDK**: `@google/generative-ai`
- **Models**: `gemini-1.5-pro`, `gemini-2.0-flash`
- **Deferrable**: Can be implemented later if needed

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Retry Logic Strategy

**Exponential Backoff Pattern:**
```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds
Total: 3 retries, max 7 seconds delay
```

**Error Classification:**
1. **Transient Errors** (retry with backoff):
   - 429 Rate Limit Exceeded
   - 503 Service Unavailable
   - Network timeouts
   - Connection errors

2. **Auth Errors** (no retry, escalate immediately):
   - 401 Unauthorized (invalid API key)
   - 403 Forbidden (insufficient permissions)

3. **Permanent Errors** (no retry, escalate):
   - 400 Bad Request (invalid parameters)
   - 404 Not Found (invalid endpoint)
   - Model validation failures

**Logging on Retry:**
- Log each retry attempt with context: `Retry 2/3 for Anthropic API call, waiting 2s, error: Rate limit exceeded`
- After max retries: Throw detailed error with all retry attempts logged

[Source: docs/tech-spec-epic-1.md#Non-Functional-Requirements]

### Testing Strategy

**Unit Tests (60% of coverage):**
- Test LLMFactory provider registration and retrieval
- Test client creation for each provider
- Test model validation (valid and invalid models)
- Test retry logic with mocked API failures
- Test request/response logging (verify API keys redacted)
- Test error classification and handling
- Mock external LLM APIs using test doubles

**Integration Tests (30% of coverage):**
- Test Anthropic OAuth token authentication (dev subscription)
- Test Anthropic API key fallback
- Test OpenAI API calls with real API (dev key)
- Test Zhipu native API calls (dev key)
- Test z.ai wrapper with Anthropic-compatible GLM access
- Test per-agent configuration loading from project-config.yaml
- Test cost estimation accuracy

**Edge Cases:**
- Missing environment variables (API keys)
- Invalid model names for provider
- Network failures during API calls
- Malformed responses from LLM APIs
- Circular retry loops (ensure max attempts enforced)
- Unicode handling in prompts and responses

[Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary]

### Error Handling Best Practices

**Error Types:**
1. **Provider Errors**: LLM API failures → Classify, retry transient, escalate auth/permanent
2. **Validation Errors**: Invalid model/provider → Clear message with valid options
3. **Configuration Errors**: Missing agent in config → Fail fast with helpful message
4. **Network Errors**: Timeouts, connection issues → Retry with exponential backoff

**Error Message Format:**
```
LLMFactoryError: Failed to create LLM client for agent "winston"

Reason: Invalid model "gpt-5-ultra" for provider "openai"

Valid models for OpenAI:
  - gpt-4-turbo
  - gpt-4
  - gpt-3.5-turbo-instruct

Please update agent_assignments in .bmad/project-config.yaml
```

[Source: docs/tech-spec-epic-1.md#Non-Functional-Requirements]

### References

- **Epic Tech Spec**: [docs/tech-spec-epic-1.md](../tech-spec-epic-1.md#LLM-Factory-Pattern)
- **Architecture**: [docs/architecture.md#LLM-Factory](../architecture.md)
- **Story Source**: [docs/epics.md#Story-1-3](../epics.md)
- **Dependencies**: Story 1.1 (ProjectConfig class required)
- **Anthropic API Docs**: https://docs.anthropic.com/claude/reference/messages_post
- **OpenAI API Docs**: https://platform.openai.com/docs/api-reference/chat
- **Zhipu API Docs**: (Consult Zhipu GLM official documentation)

### Learnings from Previous Story

**From Story 1-2-workflow-yaml-parser (Status: drafted)**

Story 1.2 is currently drafted but not yet implemented. However, the story specification provides key context for this story:

**Expected Deliverables from Story 1.2:**
- ✅ WorkflowParser class at `backend/src/core/WorkflowParser.ts`
- ✅ Variable resolution system for workflow.yaml
- ✅ Integration with ProjectConfig for config_source loading

**Integration Points:**
- LLMFactory will NOT directly depend on WorkflowParser (independent components)
- Both LLMFactory and WorkflowParser depend on ProjectConfig (Story 1.1)
- LLMFactory focuses on LLM client creation, no workflow awareness needed

**Dependency on Story 1.1:**
- LLMFactory requires ProjectConfig to load agent_assignments from `.bmad/project-config.yaml`
- ProjectConfig provides `getAgentLLMConfig(agentName: string)` method
- Must integrate with ProjectConfig's config loading mechanism

**Next Story Dependency:**
- Story 1.4 (Agent Pool) will depend on this LLMFactory
- Agent Pool will call `LLMFactory.createClient(config)` to spawn agents with configured LLMs
- Clean API contract essential for agent pool integration

**Key Takeaways:**
- LLMFactory is a foundational component used by Agent Pool (Story 1.4)
- Must be thoroughly tested before Story 1.4 begins
- Provider abstraction critical for future cost-quality optimization (Story 1.13)
- Multi-provider support enables flexible LLM assignment per agent

[Source: docs/stories/1-2-workflow-yaml-parser.md]

## Dev Agent Record

### Context Reference

- `docs/stories/1-3-llm-factory-pattern-implementation.context.xml` (generated 2025-11-05)

### Agent Model Used

_To be determined during implementation_

### Debug Log References

_To be added during development_

### Completion Notes List

_To be added upon story completion_

### File List

_To be added upon story completion_

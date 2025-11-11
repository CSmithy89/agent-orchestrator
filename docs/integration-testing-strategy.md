# Integration Testing Strategy

**Purpose**: Define integration testing approach, coverage targets, and patterns for the Agent Orchestrator project.

**Date**: 2025-11-12
**Status**: Active
**Context**: Story 2.9 Task 6 (Technical Debt Resolution)

---

## Overview

This document establishes the integration testing strategy for the Agent Orchestrator, including:
- When to use real vs mocked LLM providers
- API key dependency management
- Integration test coverage targets
- Test templates and patterns
- Local testing coordination with CI/CD

**Key Principle**: Integration tests run locally with real API keys to validate end-to-end functionality while maintaining fast CI/CD feedback loops for code quality.

---

## Integration Test Scope

### What Integration Tests Cover

**Integration tests validate**:
- Real LLM provider API interactions (Anthropic, OpenAI, Zhipu)
- Agent persona behavior with actual AI responses
- Workflow execution end-to-end
- Multi-agent collaboration patterns
- State persistence across workflow steps
- Error handling with real API errors
- Performance under actual API latency

**Integration tests do NOT cover**:
- Unit-level logic (covered by unit tests)
- UI behavior (covered by E2E tests)
- Deployment infrastructure (covered by smoke tests)

### Integration Test Categories

| Category | Description | Example Tests |
|----------|-------------|---------------|
| **Agent Personas** | AI agent behavior with real LLMs | Mary Agent persona validation |
| **Workflows** | End-to-end workflow execution | PRD workflow integration |
| **Multi-Agent** | Agent collaboration patterns | Mary-John handoff testing |
| **Services** | Service integration points | EscalationQueue with agents |
| **State Management** | State persistence and recovery | WorkflowState across steps |

---

## Real vs Mocked LLM Providers

### When to Use Real LLM Providers

✅ **Use real providers for**:
- **Integration tests** with API keys available (local execution)
- **Acceptance testing** scenarios validating end-user value
- **Full end-to-end validation** of critical workflows
- **Performance testing** under realistic API latency
- **Agent persona validation** (output quality, decision-making)

**Example**:
```typescript
describe('MaryAgent Integration Tests', () => {
  it.skipIf(!hasApiKeys())('should gather requirements with real LLM', async () => {
    const config: LLMConfig = {
      provider: 'claude-code', // Real provider
      model: 'claude-sonnet-4-5',
    };

    const agent = new MaryAgent(config);
    const result = await agent.gatherRequirements(userInput);

    // Validate real AI behavior
    expect(result.requirements).toHaveLength(greaterThan(3));
    expect(result.confidence).toBeGreaterThan(0.8);
  });
});
```

### When to Use Mocked Providers

✅ **Use mocked providers for**:
- **Unit tests** focused on component logic
- **Tests without API keys** (CI/CD, new developer setup)
- **Fast feedback loops** during development
- **Component isolation testing** (test logic, not AI)
- **Deterministic test scenarios** (need predictable outputs)

**Example**:
```typescript
describe('MaryAgent Unit Tests', () => {
  it('should parse requirements from LLM response', async () => {
    const mockProvider = createMockLLMProvider({
      response: 'REQ-1: User login\nREQ-2: Password reset',
    });

    const agent = new MaryAgent(mockProvider);
    const result = await agent.gatherRequirements(userInput);

    // Test parsing logic, not AI quality
    expect(result.requirements).toHaveLength(2);
    expect(result.requirements[0].id).toBe('REQ-1');
  });
});
```

---

## API Key Dependency Strategy

### Local Development Setup

**Required API Keys** (`.env` file):
```bash
# Required for integration tests
CLAUDE_CODE_OAUTH_TOKEN=your_token_here    # Anthropic Claude via OAuth
ANTHROPIC_API_KEY=your_key_here            # Anthropic Claude direct

# Optional for multi-provider testing
OPENAI_API_KEY=your_key_here               # OpenAI GPT-4
ZHIPU_API_KEY=your_key_here                # Zhipu GLM-4
```

### API Key Availability Checking

**Use shared utility** (`backend/tests/utils/apiKeys.ts`):
```typescript
import { hasApiKeys, getTestProvider, hasProviderKey } from '../utils/apiKeys.js';

// Skip integration tests if no API keys
it.skipIf(!hasApiKeys())('should call real LLM', async () => {
  const provider = getTestProvider(); // Returns 'claude-code' or 'anthropic'
  // Test code...
});

// Provider-specific tests
it.skipIf(!hasProviderKey('openai'))('should use OpenAI', async () => {
  // OpenAI-specific test...
});
```

### API Key Security Best Practices

**DO**:
- ✅ Store API keys in `.env` (gitignored)
- ✅ Use `dotenv` to load keys at runtime
- ✅ Check `hasApiKeys()` before integration tests
- ✅ Document required keys in README and test docs
- ✅ Use OAuth tokens when available (more secure)

**DON'T**:
- ❌ Commit API keys to git (ever!)
- ❌ Hardcode keys in test files
- ❌ Share keys in public channels
- ❌ Use production keys for testing

---

## Integration Test Coverage Targets

### Coverage by Component

| Component | Integration Coverage Target | Rationale |
|-----------|----------------------------|-----------|
| **Agent Personas** | ≥80% | Critical AI behavior validation |
| **Workflow Executors** | ≥80% | End-to-end workflow integrity |
| **Service Integrations** | ≥70% | Third-party integration points |
| **State Management** | ≥60% | State persistence scenarios |
| **LLM Providers** | ≥90% | Provider abstraction layer |

### What "Integration Coverage" Means

**Integration coverage measures**:
- % of integration points tested with real dependencies
- % of critical user paths validated end-to-end
- % of agent personas tested with real LLMs
- % of error scenarios tested with real API errors

**Not measured by**:
- Line coverage (that's unit test coverage)
- Number of tests (quality over quantity)
- Test execution time

### Measuring Integration Coverage

**Manual assessment**:
1. List all integration points (agents, workflows, services)
2. Count integration tests for each component
3. Calculate coverage percentage
4. Review quarterly and adjust targets

**Example**:
```
Mary Agent Integration Points:
- gatherRequirements() - ✅ tested
- defineSuccessCriteria() - ✅ tested
- negotiateScope() - ✅ tested
- generatePRD() - ✅ tested
- validatePRD() - ❌ not tested

Coverage: 4/5 = 80% ✅ Meets target
```

---

## Integration Test Templates

### Template 1: Agent Persona Integration Test

```typescript
import { describe, it, expect } from 'vitest';
import { hasApiKeys, getTestProvider } from '../utils/apiKeys.js';
import { MaryAgent } from '../../src/core/agents/mary-agent.js';

describe('MaryAgent Integration Tests', () => {
  // Skip all tests if no API keys
  const skipTests = !hasApiKeys();

  describe('Multi-Provider Support', () => {
    it.skipIf(skipTests)('should work with claude-code provider', async () => {
      const config = {
        provider: 'claude-code',
        model: 'claude-sonnet-4-5',
      };

      const agent = new MaryAgent(config);
      const result = await agent.gatherRequirements('Build a todo app');

      expect(result).toBeDefined();
      expect(result.requirements).toHaveLength(greaterThan(0));
    });
  });

  describe('Agent Behavior', () => {
    it.skipIf(skipTests)('should produce specific, non-vague requirements', async () => {
      const provider = getTestProvider();
      const agent = new MaryAgent({ provider, model: 'claude-sonnet-4-5' });

      const result = await agent.gatherRequirements('E-commerce platform');

      // Validate output quality
      expect(result.requirements.some(r => r.includes('vague'))).toBe(false);
      expect(result.requirements.some(r => r.includes('TBD'))).toBe(false);
    });
  });

  describe('Performance Requirements', () => {
    it.skipIf(skipTests)('should complete in <45 seconds', async () => {
      const startTime = Date.now();
      const provider = getTestProvider();
      const agent = new MaryAgent({ provider, model: 'claude-sonnet-4-5' });

      await agent.gatherRequirements('Simple web app');

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(45000);
    });
  });

  describe('Error Handling', () => {
    it.skipIf(skipTests)('should handle API rate limits gracefully', async () => {
      // Test with rapid successive calls
      const provider = getTestProvider();
      const agent = new MaryAgent({ provider, model: 'claude-sonnet-4-5' });

      const promises = Array.from({ length: 5 }, () =>
        agent.gatherRequirements('Test input')
      );

      // Should not throw, may queue or throttle
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });
  });
});
```

### Template 2: Workflow Integration Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hasApiKeys } from '../utils/apiKeys.js';
import { PRDWorkflowExecutor } from '../../src/core/workflows/prd-workflow-executor.js';
import fs from 'fs/promises';
import path from 'path';

describe('PRD Workflow Integration Tests', () => {
  const skipTests = !hasApiKeys();
  let testDir: string;

  beforeEach(async () => {
    testDir = path.join(process.cwd(), 'test-output', Date.now().toString());
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it.skipIf(skipTests)('should execute complete PRD workflow', async () => {
    const executor = new PRDWorkflowExecutor({
      outputDir: testDir,
      llmProvider: 'claude-code',
    });

    const result = await executor.execute({
      projectName: 'Test Project',
      userInput: 'Build a task management app',
    });

    // Validate workflow completion
    expect(result.status).toBe('completed');
    expect(result.artifacts).toHaveProperty('prd');

    // Validate output artifacts
    const prdPath = path.join(testDir, 'PRD.md');
    const prdExists = await fs.access(prdPath).then(() => true).catch(() => false);
    expect(prdExists).toBe(true);

    const prdContent = await fs.readFile(prdPath, 'utf-8');
    expect(prdContent).toContain('# PRD:');
    expect(prdContent.length).toBeGreaterThan(500);
  });

  it.skipIf(skipTests)('should handle agent collaboration', async () => {
    const executor = new PRDWorkflowExecutor({ llmProvider: 'claude-code' });

    const result = await executor.execute({
      projectName: 'Collaboration Test',
      userInput: 'Complex multi-step project',
    });

    // Validate Mary gathered requirements
    expect(result.steps).toContainEqual(
      expect.objectContaining({ agent: 'mary', status: 'completed' })
    );

    // Validate John structured requirements
    expect(result.steps).toContainEqual(
      expect.objectContaining({ agent: 'john', status: 'completed' })
    );
  });
});
```

### Template 3: Multi-Agent Collaboration Test

```typescript
import { describe, it, expect } from 'vitest';
import { hasApiKeys } from '../utils/apiKeys.js';
import { MaryAgent } from '../../src/core/agents/mary-agent.js';
import { JohnAgent } from '../../src/core/agents/john-agent.js';

describe('Mary-John Collaboration Integration Tests', () => {
  const skipTests = !hasApiKeys();

  it.skipIf(skipTests)('should hand off requirements from Mary to John', async () => {
    const llmConfig = { provider: 'claude-code', model: 'claude-sonnet-4-5' };

    // Mary gathers requirements
    const mary = new MaryAgent(llmConfig);
    const requirements = await mary.gatherRequirements('Build CRM system');

    // John structures requirements
    const john = new JohnAgent(llmConfig);
    const structured = await john.structureRequirements(requirements);

    // Validate handoff
    expect(structured.epics).toHaveLength(greaterThan(0));
    expect(structured.epics[0].stories).toHaveLength(greaterThan(0));

    // Validate data transformation
    requirements.requirements.forEach(req => {
      const foundInEpics = structured.epics.some(epic =>
        epic.stories.some(story => story.requirements.includes(req))
      );
      expect(foundInEpics).toBe(true);
    });
  });

  it.skipIf(skipTests)('should escalate when requirements unclear', async () => {
    const llmConfig = { provider: 'claude-code', model: 'claude-sonnet-4-5' };

    const mary = new MaryAgent(llmConfig);

    // Vague input should trigger escalation
    const result = await mary.gatherRequirements('Make it better');

    expect(result.needsEscalation).toBe(true);
    expect(result.escalationReason).toBeDefined();
  });
});
```

---

## Local Testing and CI/CD Coordination

### Local Testing Requirements

**Before creating PR**:
1. Run full test suite locally: `npm test`
2. Verify all integration tests pass (0 skipped)
3. Check test coverage: `npm run test:coverage`
4. Ensure API keys configured in `.env`

**Local test execution**:
```bash
cd backend

# Run all tests (unit + integration)
npm test

# Run only integration tests
npm test -- integration

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### CI/CD Pipeline Role

**CI/CD performs** (NO integration tests):
- ✅ ESLint validation (`npm run lint`)
- ✅ TypeScript type checking (`npm run type-check`)
- ✅ Build verification (`npm run build`)

**CI/CD does NOT perform**:
- ❌ Integration tests (require API keys)
- ❌ Unit tests (resource constraints - OOM in CI)

**Rationale**: GitHub Actions runners have insufficient resources for 695-test suite. See `docs/local-testing-strategy.md` for full rationale.

### PR Requirements

**Code review checklist** (`.github/pull_request_template.md`):
- [ ] All tests passing locally (0 failures, 0 skipped)
- [ ] Integration tests run with real API keys
- [ ] Coverage targets met (≥90% core, ≥80% overall)
- [ ] No test flakiness observed
- [ ] Performance regression check (if applicable)

### Testing Verification in Code Review

**Reviewer responsibilities**:
1. Verify PR author confirms tests passed locally
2. Ask for test output or coverage report if unclear
3. Check that new integration points have integration tests
4. Validate API key dependencies documented
5. Ensure test patterns follow this strategy

---

## Epic 3 Integration Testing Plan

### Winston Agent Integration Tests

**Coverage target**: ≥80%

**Test scenarios**:
- Architecture pattern recommendations with real LLM
- Technology stack selection with real LLM
- Technical decision documentation with real LLM
- Collaboration with Mary (PRD → Architecture handoff)
- Performance: Complete in <60 seconds

**Test file**: `backend/tests/integration/winston-agent.test.ts`

### Murat Agent Integration Tests

**Coverage target**: ≥80%

**Test scenarios**:
- Epic decomposition from PRD with real LLM
- Story breakdown from epics with real LLM
- Task estimation with real LLM
- Collaboration with John (structured requirements → stories)
- Performance: Complete in <60 seconds

**Test file**: `backend/tests/integration/murat-agent.test.ts`

### Architecture Workflow Integration Tests

**Coverage target**: ≥80%

**Test scenarios**:
- End-to-end PRD → Architecture workflow
- Winston agent integration
- Artifact generation (architecture.md)
- Error handling and escalation
- Performance: Complete in <90 seconds

**Test file**: `backend/tests/integration/architecture-workflow.test.ts`

### Story Decomposition Workflow Integration Tests

**Coverage target**: ≥80%

**Test scenarios**:
- End-to-end PRD → Stories workflow
- Murat agent integration
- Story file generation
- Sprint planning artifact creation
- Performance: Complete in <120 seconds

**Test file**: `backend/tests/integration/story-workflow.test.ts`

---

## Performance Expectations

### Integration Test Performance Targets

| Test Type | Target Duration | Max Duration |
|-----------|----------------|--------------|
| Single agent operation | <45s | <60s |
| Multi-agent collaboration | <60s | <90s |
| Complete workflow | <90s | <120s |
| Full integration suite | <10min | <15min |

### Performance Monitoring

**Track performance in integration tests**:
```typescript
it('should complete in <45 seconds', async () => {
  const startTime = Date.now();

  await agent.performOperation();

  const duration = Date.now() - startTime;
  expect(duration).toBeLessThan(45000);

  console.log(`Duration: ${duration}ms`); // Track for regression detection
});
```

**Performance regression detection**:
- Review console logs for duration increases
- Compare against historical performance
- Investigate if >20% slower than baseline
- Consider API latency, not just code performance

---

## Error Handling in Integration Tests

### Expected Error Scenarios

**Integration tests should validate**:
- API rate limiting (429 errors)
- Network timeouts
- Invalid API responses
- Authentication failures
- Model unavailable errors

**Example**:
```typescript
it('should retry on transient failures', async () => {
  const agent = new MaryAgent({
    provider: 'claude-code',
    maxRetries: 3,
    retryDelayMs: 1000,
  });

  // Test continues even if first attempt fails
  const result = await agent.gatherRequirements('Test input');
  expect(result).toBeDefined();
});

it('should escalate on persistent failures', async () => {
  const agent = new MaryAgent({
    provider: 'invalid-provider', // Will fail
    maxRetries: 1,
  });

  await expect(
    agent.gatherRequirements('Test input')
  ).rejects.toThrow(/provider.*not supported/i);
});
```

---

## Integration Testing Best Practices

### DO

✅ **Use real API keys** for integration tests (local execution only)
✅ **Skip tests gracefully** when API keys unavailable (`it.skipIf(!hasApiKeys())`)
✅ **Test agent behavior**, not just technical integration
✅ **Validate output quality**, not just that it returns something
✅ **Include performance checks** to catch regressions
✅ **Test error scenarios** with real API errors
✅ **Clean up resources** (files, state) in `afterEach`
✅ **Use shared utilities** from `backend/tests/utils/`

### DON'T

❌ **Don't commit API keys** (use `.env`, never git)
❌ **Don't run integration tests in CI/CD** (use local testing)
❌ **Don't mock LLMs** in integration tests (defeats the purpose)
❌ **Don't assume deterministic AI** outputs (test patterns, not exact text)
❌ **Don't skip error handling tests** (critical for production)
❌ **Don't ignore performance** regressions
❌ **Don't duplicate test setup code** (use shared utilities)

---

## Troubleshooting Integration Tests

### Common Issues

**Issue**: Tests skip with "No API keys available"
- **Fix**: Add `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` to `.env`

**Issue**: Tests fail with "Rate limit exceeded"
- **Fix**: Add delays between tests, or reduce test parallelism

**Issue**: Tests fail with "Timeout"
- **Fix**: Increase test timeout (default: 30s) or check API latency

**Issue**: Tests flaky (pass sometimes, fail sometimes)
- **Fix**: Check for race conditions, ensure proper cleanup, add retries

**Issue**: Tests slow (>15min for full suite)
- **Fix**: Review API call count, consider batching, check for unnecessary waits

---

## References

- **Local Testing Strategy**: `docs/local-testing-strategy.md` - Why integration tests run locally
- **Testing Guide**: `docs/testing-guide.md` - General testing patterns and standards
- **Async Patterns Guide**: `docs/async-patterns-guide.md` - Async/await best practices
- **API Key Utilities**: `backend/tests/utils/apiKeys.ts` - Shared API key helpers
- **Mock Utilities**: `backend/tests/utils/mockAgents.ts` - Mock factories for unit tests
- **PR Template**: `.github/pull_request_template.md` - Testing requirements checklist

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-12 | Initial strategy document (Story 2.9 Task 6) |

---

**Status**: ✅ ACTIVE
**Next Review**: Epic 3 Retrospective
**Maintained By**: Test Infrastructure Lead

---

**Note**: This strategy evolves with the project. Update quarterly or when significant integration testing needs change.

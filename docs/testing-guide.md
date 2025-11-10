# Testing Guide

**Date**: 2025-11-10
**Status**: Active
**Context**: Story 2.9 Task 2 (Action Item #2 - Epic 2 Retrospective)

---

## Overview

This guide provides comprehensive testing standards, patterns, and best practices for the Agent Orchestrator project.

**Purpose**: Eliminate duplicate test utilities, document standard configurations, and prevent common testing pitfalls identified in Epic 1 and Epic 2 retrospectives.

---

## Table of Contents

1. [Test Types and Structure](#test-types-and-structure)
2. [Standard Git Configuration for Tests](#standard-git-configuration-for-tests)
3. [Async Pattern Testing](#async-pattern-testing)
4. [API Key Management](#api-key-management)
5. [Shared Test Utilities](#shared-test-utilities)
6. [Common Test Pitfalls](#common-test-pitfalls)
7. [Test Coverage Requirements](#test-coverage-requirements)
8. [Writing Tests Checklist](#writing-tests-checklist)

---

## Test Types and Structure

### Directory Structure

```
backend/
├── src/              # Source code
├── tests/
│   ├── unit/         # Unit tests (isolated, mocked dependencies)
│   ├── integration/  # Integration tests (real dependencies, may use APIs)
│   ├── e2e/          # End-to-end tests (full workflow scenarios)
│   └── utils/        # Shared test utilities (NEW - Story 2.9)
│       ├── apiKeys.ts        # API key availability helpers
│       ├── mockAgents.ts     # Mock agent factories
│       ├── gitSetup.ts       # Git configuration utilities
│       └── fixtures.ts       # Common test data
```

### Unit Tests

**Purpose**: Test individual functions/methods in isolation

**Characteristics**:
- Fast execution (< 10ms per test)
- No external dependencies (filesystem, network, LLM APIs)
- All dependencies mocked
- Predictable, deterministic results

**Example**:
```typescript
// backend/tests/unit/template-processor.test.ts
import { describe, it, expect, vi } from 'vitest';
import { TemplateProcessor } from '../../src/core/templates/TemplateProcessor.js';

describe('TemplateProcessor', () => {
  it('should replace variables in template', () => {
    const processor = new TemplateProcessor();
    const result = processor.process('Hello {{name}}', { name: 'World' });
    expect(result).toBe('Hello World');
  });
});
```

### Integration Tests

**Purpose**: Test component interactions with real or near-real dependencies

**Characteristics**:
- Moderate execution time (100ms - 5s per test)
- May use real LLM APIs (with API keys)
- May use real filesystem/Git operations
- Cleanup required after tests

**Example**:
```typescript
// backend/tests/integration/mary-agent.test.ts
import { describe, it, expect } from 'vitest';
import { MaryAgent } from '../../src/core/agents/mary-agent.js';
import { hasApiKeys } from '../utils/apiKeys.js'; // Shared utility

describe('MaryAgent Integration Tests', () => {
  it.skipIf(!hasApiKeys())('should analyze requirements', async () => {
    const mary = await MaryAgent.create(config, llmFactory);
    const result = await mary.analyzeRequirements('Build user auth');
    expect(result.requirements).toBeDefined();
  });
});
```

### E2E Tests

**Purpose**: Test complete workflows from start to finish

**Characteristics**:
- Slower execution (5s - 60s per test)
- Full system integration
- Real file operations, Git commits, LLM calls
- Extensive cleanup required

**Example**:
```typescript
// backend/tests/e2e/prd-workflow.test.ts
describe('PRD Workflow E2E', () => {
  it('should complete full PRD generation workflow', async () => {
    // 1. Initialize project
    // 2. Mary analyzes requirements
    // 3. John generates PRD
    // 4. Workflow validates quality
    // 5. Output saved to filesystem
  });
});
```

---

## Standard Git Configuration for Tests

### Problem (Epic 1.11)

Tests failed with:
```
Error: Please tell me who you are. Run git config user.email, git config user.name
```

**Root Cause**: Git operations in tests require user identity configuration.

### Solution: Standard Git Setup Utility

Use the shared `setupGitConfig()` utility from `tests/utils/gitSetup.ts`:

```typescript
import { setupGitConfig, cleanupGitConfig } from '../utils/gitSetup.js';

describe('Git Operations Tests', () => {
  beforeEach(async () => {
    await setupGitConfig();
  });

  afterEach(async () => {
    await cleanupGitConfig();
  });

  it('should commit changes', async () => {
    // Git operations work without manual configuration
    await git.commit('Test commit');
  });
});
```

### Git Configuration Details

**What `setupGitConfig()` does**:
1. Sets `user.name` = `"Test User"`
2. Sets `user.email` = `"test@example.com"`
3. Disables GPG signing: `commit.gpgsign` = `false`
4. Configures for test worktrees if needed

**Why disable GPG signing**:
- CI/CD environments don't have GPG keys
- Signing not needed for test commits
- Prevents "gpg: signing failed: No secret key" errors

**When to use**:
- Any test that creates Git commits
- Any test using `GitWorktreeManager`
- Any test using `StateManager` with Git persistence

---

## Async Pattern Testing

### Standard Async Test Pattern

Always use `async`/`await` for asynchronous operations:

```typescript
// ✅ CORRECT
it('should process data asynchronously', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});

// ❌ INCORRECT - Missing async/await
it('should process data', () => {
  const result = asyncFunction(); // Returns Promise, not result!
  expect(result).toBe('expected'); // Fails
});
```

### Testing Promise Rejection

```typescript
it('should throw error for invalid input', async () => {
  await expect(asyncFunction('invalid')).rejects.toThrow('Invalid input');
});

// Alternative
it('should throw error for invalid input', async () => {
  try {
    await asyncFunction('invalid');
    fail('Expected error to be thrown');
  } catch (error) {
    expect(error.message).toBe('Invalid input');
  }
});
```

### Testing Timeouts

```typescript
it('should timeout after 5 seconds', async () => {
  const promise = longRunningOperation();
  await expect(promise).rejects.toThrow('Timeout');
}, 6000); // Test timeout slightly longer than operation timeout
```

### Testing File Operations (Async)

```typescript
// ✅ CORRECT - Use async fs methods
it('should write file asynchronously', async () => {
  await fs.writeFile('test.txt', 'content');
  const content = await fs.readFile('test.txt', 'utf-8');
  expect(content).toBe('content');
});

// ❌ INCORRECT - Don't use sync methods in async tests
it('should write file', async () => {
  fs.writeFileSync('test.txt', 'content'); // Anti-pattern
  const content = fs.readFileSync('test.txt', 'utf-8');
  expect(content).toBe('content');
});
```

**Reference**: See `docs/async-patterns-guide.md` for complete async patterns.

---

## API Key Management

### Checking API Key Availability

Use the shared `hasApiKeys()` helper:

```typescript
import { hasApiKeys } from '../utils/apiKeys.js';

describe('Integration Tests', () => {
  it.skipIf(!hasApiKeys())('should call LLM API', async () => {
    // Test only runs if API keys available
    const result = await llm.generate('prompt');
    expect(result).toBeDefined();
  });
});
```

### API Key Environment Variables

**Local Development** (`.env` file):
```bash
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
ANTHROPIC_API_KEY=sk-ant-api01-...
OPENAI_API_KEY=sk-...
ZHIPU_API_KEY=...
```

**CI/CD** (GitHub Secrets):
- Configured in repository settings
- See `docs/ci-secrets-management.md` for setup

### Test Behavior Matrix

| Environment | API Keys | Test Behavior |
|-------------|----------|---------------|
| Local (with `.env`) | Available | All integration tests run |
| Local (no `.env`) | Missing | Integration tests skipped |
| CI/CD (secrets configured) | Available | All integration tests run |
| CI/CD (no secrets) | Missing | Integration tests skipped |

### Best Practices

1. **Always use `skipIf` for API-dependent tests**:
   ```typescript
   it.skipIf(!hasApiKeys())('test name', async () => { });
   ```

2. **Don't fail tests when API keys missing**:
   ```typescript
   // ❌ INCORRECT
   it('should call API', async () => {
     if (!process.env.ANTHROPIC_API_KEY) {
       throw new Error('API key required');
     }
   });
   ```

3. **Provide mock fallback for unit tests**:
   ```typescript
   it('should work with mocked LLM', async () => {
     const mockLLM = createMockLLM(); // From utils/mockAgents.ts
     const result = await component.process(mockLLM);
     expect(result).toBeDefined();
   });
   ```

---

## Shared Test Utilities

### Location

All shared test utilities are in `backend/tests/utils/`:

```
tests/utils/
├── apiKeys.ts        # API key helpers
├── mockAgents.ts     # Mock agent factories
├── gitSetup.ts       # Git configuration
└── fixtures.ts       # Common test data
```

### API Key Utilities (`apiKeys.ts`)

```typescript
/**
 * Check if API keys are available for integration testing
 */
export const hasApiKeys = (): boolean => {
  return !!(
    process.env.ANTHROPIC_API_KEY ||
    process.env.CLAUDE_CODE_OAUTH_TOKEN
  );
};

/**
 * Get available provider for testing
 */
export const getTestProvider = (): string => {
  if (process.env.CLAUDE_CODE_OAUTH_TOKEN) return 'claude-code';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  throw new Error('No API keys available');
};
```

**Usage**:
```typescript
import { hasApiKeys, getTestProvider } from '../utils/apiKeys.js';

it.skipIf(!hasApiKeys())('should work with available provider', async () => {
  const provider = getTestProvider();
  const config = { provider, model: 'claude-sonnet-4-5' };
  // ... test with config
});
```

### Mock Agent Factories (`mockAgents.ts`)

```typescript
/**
 * Create mock LLMFactory for unit tests
 */
export const createMockLLMFactory = () => {
  return {
    createClient: vi.fn().mockResolvedValue(createMockLLMClient()),
    registerProvider: vi.fn()
  };
};

/**
 * Create mock LLM client
 */
export const createMockLLMClient = () => {
  return {
    generateText: vi.fn().mockResolvedValue({
      text: 'Mock LLM response',
      usage: { inputTokens: 10, outputTokens: 20 }
    })
  };
};

/**
 * Create mock DecisionEngine
 */
export const createMockDecisionEngine = () => {
  return {
    makeDecision: vi.fn().mockResolvedValue({
      decision: 'proceed',
      confidence: 0.95,
      reasoning: 'Mock decision'
    })
  };
};

/**
 * Create mock EscalationQueue
 */
export const createMockEscalationQueue = () => {
  return {
    add: vi.fn(),
    getAll: vi.fn().mockReturnValue([]),
    resolve: vi.fn()
  };
};
```

**Usage**:
```typescript
import { createMockLLMFactory, createMockDecisionEngine } from '../utils/mockAgents.js';

describe('Unit Tests with Mocks', () => {
  it('should work with mocked dependencies', async () => {
    const mockLLM = createMockLLMFactory();
    const mockDE = createMockDecisionEngine();

    const agent = await MaryAgent.create(config, mockLLM, mockDE);
    // ... test agent without real LLM calls
  });
});
```

### Git Setup Utilities (`gitSetup.ts`)

```typescript
/**
 * Configure Git for test environment
 */
export const setupGitConfig = async () => {
  const git = simpleGit();
  await git.addConfig('user.name', 'Test User');
  await git.addConfig('user.email', 'test@example.com');
  await git.addConfig('commit.gpgsign', 'false');
};

/**
 * Clean up Git test configuration
 */
export const cleanupGitConfig = async () => {
  // Clean up test worktrees, commits, etc.
};

/**
 * Create temporary Git repository for testing
 */
export const createTestRepo = async (path: string) => {
  await fs.mkdir(path, { recursive: true });
  const git = simpleGit(path);
  await git.init();
  await setupGitConfig();
  return git;
};
```

**Usage**:
```typescript
import { setupGitConfig, createTestRepo } from '../utils/gitSetup.js';

describe('Git Operations', () => {
  let testRepo: string;

  beforeEach(async () => {
    testRepo = path.join(__dirname, 'temp-repo');
    await createTestRepo(testRepo);
  });

  afterEach(async () => {
    await fs.rm(testRepo, { recursive: true, force: true });
  });

  it('should commit changes', async () => {
    // Test with configured Git
  });
});
```

### Test Fixtures (`fixtures.ts`)

```typescript
/**
 * Sample LLM configuration for testing
 */
export const sampleLLMConfig: LLMConfig = {
  provider: 'claude-code',
  model: 'claude-sonnet-4-5',
  temperature: 0.3,
  maxTokens: 4000
};

/**
 * Sample user prompt for testing
 */
export const sampleUserPrompt = 'Build a user authentication system with email/password and OAuth support';

/**
 * Sample PRD content for testing
 */
export const samplePRDContent = `# Product Requirements Document
## Overview
...
`;
```

**Usage**:
```typescript
import { sampleLLMConfig, sampleUserPrompt } from '../utils/fixtures.js';

it('should analyze requirements', async () => {
  const mary = await MaryAgent.create(sampleLLMConfig, llmFactory);
  const result = await mary.analyzeRequirements(sampleUserPrompt);
  expect(result).toBeDefined();
});
```

---

## Common Test Pitfalls

### Pitfall 1: Git Signing Not Disabled (Epic 1.11)

**Symptom**:
```
Error: gpg: signing failed: No secret key
```

**Solution**: Use `setupGitConfig()` utility which disables signing.

### Pitfall 2: WorkflowParser Concurrency Issues (Story 2.8)

**Problem**: Multiple tests creating WorkflowParser instances concurrently caused race conditions.

**Solution**: Use `beforeEach`/`afterEach` to create isolated instances:
```typescript
describe('WorkflowParser Tests', () => {
  let parser: WorkflowParser;

  beforeEach(() => {
    parser = new WorkflowParser();
  });

  it('should parse workflow', async () => {
    const result = await parser.parse(workflowYaml);
    expect(result).toBeDefined();
  });
});
```

### Pitfall 3: Missing Async/Await

**Problem**: Forgetting `await` causes tests to pass even when they should fail.

**Example**:
```typescript
// ❌ INCORRECT
it('should process data', async () => {
  const result = asyncFunction(); // Missing await!
  expect(result).toBeDefined(); // Always passes (Promise is defined)
});

// ✅ CORRECT
it('should process data', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Pitfall 4: Test Isolation Failures

**Problem**: Tests affect each other through shared state.

**Example**:
```typescript
// ❌ INCORRECT - Shared state
let sharedAgent: MaryAgent;

describe('Tests', () => {
  beforeAll(async () => {
    sharedAgent = await MaryAgent.create(config);
  });

  it('test 1', async () => {
    sharedAgent.setState('modified'); // Affects test 2!
  });

  it('test 2', async () => {
    // Expects clean state but gets modified state
  });
});

// ✅ CORRECT - Isolated instances
describe('Tests', () => {
  beforeEach(async () => {
    // Fresh instance for each test
    agent = await MaryAgent.create(config);
  });
});
```

### Pitfall 5: API Key Dependency Not Handled

**Problem**: Integration tests fail in environments without API keys instead of skipping.

**Solution**: Always use `skipIf(!hasApiKeys())`.

---

## Test Coverage Requirements

### Coverage Targets

| Component Type | Unit Coverage | Integration Coverage | Total Coverage |
|----------------|---------------|----------------------|----------------|
| Core Components | ≥90% | ≥50% | ≥90% |
| Agents | ≥85% | ≥80% | ≥90% |
| Services | ≥85% | ≥70% | ≥85% |
| Utilities | ≥90% | N/A | ≥90% |
| **Overall Project** | **≥85%** | **≥60%** | **≥80%** |

### Measuring Coverage

```bash
# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

### Coverage Report Interpretation

```
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
mary-agent.ts           |   92.5  |   88.2   |   95.0  |   93.1  | ✅
decision-engine.ts      |   78.3  |   65.4   |   82.1  |   79.6  | ⚠️
template-processor.ts   |   95.8  |   91.3   |   96.7  |   96.2  | ✅
```

**Interpretation**:
- ✅ mary-agent.ts: Exceeds targets (≥90%)
- ⚠️ decision-engine.ts: Below target (< 85%)
- ✅ template-processor.ts: Exceeds targets

### Coverage Gaps Action Plan

When coverage below target:
1. Identify uncovered lines/branches in coverage report
2. Add unit tests for uncovered code paths
3. Add integration tests for real-world scenarios
4. Document why certain code is intentionally untested (if applicable)

---

## Writing Tests Checklist

Use this checklist when writing new tests:

### Before Writing Tests

- [ ] Identify test type: unit, integration, or e2e
- [ ] Determine if API keys needed
- [ ] Review similar existing tests for patterns
- [ ] Check if shared utilities can be used

### Writing Tests

- [ ] Use `async`/`await` for all asynchronous operations
- [ ] Import shared utilities from `tests/utils/`
- [ ] Add `skipIf(!hasApiKeys())` for API-dependent tests
- [ ] Use `setupGitConfig()` for Git operations
- [ ] Create isolated test instances in `beforeEach`
- [ ] Clean up resources in `afterEach`

### Test Content

- [ ] Test has clear, descriptive name
- [ ] Test has single, focused assertion
- [ ] Test uses arrange-act-assert pattern
- [ ] Test has meaningful expect statements
- [ ] Error cases tested (not just happy path)

### After Writing Tests

- [ ] All tests pass locally: `npm test`
- [ ] Coverage targets met: `npm run test:coverage`
- [ ] No flaky tests (run multiple times)
- [ ] Tests pass in CI/CD
- [ ] Code review completed

---

## References

- **Epic 1 Retrospective**: `docs/retrospective-epic-1.md` - Git signing issue
- **Epic 2 Retrospective**: `docs/retrospective-epic-2.md` - Test configuration issues
- **Story 2.8 Notes**: WorkflowParser concurrency issue
- **Async Patterns Guide**: `docs/async-patterns-guide.md`
- **CI Secrets Management**: `docs/ci-secrets-management.md`
- **Integration Testing Strategy**: `docs/integration-testing-strategy.md` (Task 6)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-10 | Initial testing guide (Story 2.9 Task 2) |

---

**Maintained by**: Test Architect (Murat) + Development Team
**Next Review**: After Epic 3 completion
**Status**: Active - Apply to all new tests

---

## Quick Reference Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- mary-agent.test.ts

# Run specific test
npm test -- -t "should analyze requirements"

# Run integration tests only
npm test -- integration/

# Run unit tests only
npm test -- unit/

# Watch mode (re-run on file changes)
npm test -- --watch
```

---

**Need Help?** Check Epic 1/2 retrospectives for lessons learned, or reference shared utilities in `backend/tests/utils/`.

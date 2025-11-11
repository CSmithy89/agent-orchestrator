# Local Testing Strategy

**Version**: 1.0
**Last Updated**: 2025-11-12
**Status**: Active

## Overview

This project runs all integration and unit tests **locally** due to CI/CD resource constraints. The CI/CD pipeline focuses on **code quality gates** (lint, type-check, build) while comprehensive test execution happens in the developer's local environment.

## Why Local Testing?

### CI/CD Memory Constraints

After extensive troubleshooting (commits 936239d through 10fcd1e), the CI/CD environment encountered persistent Out-of-Memory (OOM) errors when running the full test suite:

- **Test Suite Size**: 695 tests (unit + integration)
- **Memory Requirements**: >4GB heap space for full test execution
- **CI/CD Limits**: GitHub Actions runners have insufficient memory for test isolation mode
- **Attempted Fixes**:
  - Coverage memory increased to 6GB (commit 2c6f5ab)
  - Coverage disabled in CI (commit c447d5d, b5346f0)
  - Memory-heavy reporters removed (commit d180c1e)
  - Test parallelization adjusted (commit 859ed9c)
  - **Final Decision**: Tests removed from CI pipeline (commit 10fcd1e)

### Current Approach

- ✅ **Local Development**: Full test suite execution with real API integrations
- ✅ **CI/CD Pipeline**: Code quality gates (lint, type-check, build)
- ✅ **Code Review**: Manual verification that all tests pass locally before PR approval

## Local Test Execution

### Prerequisites

1. **Node.js 20.x** installed
2. **API Keys** configured for integration tests
3. **Git configuration** for test execution

### Environment Setup

#### 1. Install Dependencies

```bash
cd backend
npm ci
```

#### 2. Configure API Keys

Create a `.env` file in the `backend/` directory:

```bash
# Required for integration tests
ANTHROPIC_API_KEY=your_anthropic_key_here
OPENAI_API_KEY=your_openai_key_here
ZHIPU_API_KEY=your_zhipu_key_here

# Optional for specific tests
CLAUDE_CODE_OAUTH_TOKEN=your_oauth_token_here
```

**Security Notes**:
- Never commit `.env` files to git (already in `.gitignore`)
- Use test/development API keys, not production keys
- Rotate keys periodically
- Request keys from team lead if you don't have them

#### 3. Git Configuration for Tests

Some tests require git configuration to be set up:

```bash
# Set git user (required for commit operations in tests)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Disable GPG signing for test commits
git config commit.gpgsign false
```

### Running Tests

#### Full Test Suite

Run all tests (unit + integration):

```bash
cd backend
npm test
```

**Expected Results**:
- ✅ 695 tests total
- ✅ 0 skipped tests (all integration tests should run with API keys)
- ✅ All tests passing
- ⏱️ Duration: ~30-60 seconds (varies with API latency)

#### Test Suite with Coverage

Run tests with coverage report:

```bash
cd backend
npm run test:coverage
```

**Coverage Targets**:
- Overall: >80%
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

#### Watch Mode (Development)

Run tests in watch mode for active development:

```bash
cd backend
npm run test:watch
```

#### Specific Test File

Run a specific test file:

```bash
cd backend
npm test -- mary-agent.test.ts
```

#### Specific Test Pattern

Run tests matching a pattern:

```bash
cd backend
npm test -- --testNamePattern="DecisionEngine"
```

## Integration Test Strategy

### Test Categories

1. **Unit Tests** (~60% of suite)
   - Business logic in isolation
   - No external API calls
   - Fast execution (<5ms per test)
   - Always run locally and in CI (when tests are re-enabled)

2. **Integration Tests** (~40% of suite)
   - Real LLM provider API calls
   - Agent persona end-to-end flows
   - Workflow execution with real services
   - **Local execution only** (requires API keys)

### Previously Skipped Tests

Prior to Story 2.9, 33 integration tests were skipped when API keys were unavailable. With the local testing strategy:

- ✅ All 33 tests now run locally with API keys configured
- ✅ 0 skipped tests in local execution
- ✅ Mary Agent integration tests (10+ tests)
- ✅ John Agent integration tests (8+ tests)
- ✅ DecisionEngine integration tests (6+ tests)
- ✅ EscalationQueue integration tests (4+ tests)
- ✅ PRD workflow integration tests (5+ tests)

### When to Use Real vs Mocked APIs

#### Use Real APIs (Integration Tests)
- Testing agent personas end-to-end
- Validating LLM provider integrations
- Acceptance testing scenarios
- Performance benchmarking
- Quality assurance on actual API responses

#### Use Mocked APIs (Unit Tests)
- Testing business logic in isolation
- Fast feedback loops during development
- Testing error handling without consuming API credits
- Component isolation testing

## CI/CD Configuration

### Quality Gates (Active)

The CI/CD pipeline (`.github/workflows/ci.yml`) performs these checks:

1. **Lint Check** (`npm run lint`)
   - ESLint validation
   - Code style enforcement
   - Import/export validation

2. **Type Check** (`npm run type-check`)
   - TypeScript type validation
   - Interface compliance
   - Type safety verification

3. **Build Verification** (`npm run build`)
   - Compilation success
   - Output generation (`dist/` directory)
   - No build-time errors

### Test Execution (Disabled)

- **Status**: Disabled in CI/CD due to memory constraints
- **Location**: Lines 45-47 in `.github/workflows/ci.yml`
- **Rationale**: 695 tests require >4GB heap, exceeds CI runner limits

### CI/CD Workflow

```
┌─────────────────────────────────────────────────┐
│ Push to branch or PR                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Setup: Install dependencies & cache             │
└────────────┬───────────┬────────────────────────┘
             │           │
     ┌───────▼───┐   ┌───▼──────┐
     │   Lint    │   │ Type     │
     │   Check   │   │ Check    │
     └─────┬─────┘   └────┬─────┘
           │              │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │    Build     │
           │ Verification │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │   ✅ Pass    │
           │   ❌ Fail    │
           └──────────────┘
```

## Pull Request Requirements

Before creating or approving a PR, ensure:

### Developer Checklist

- [ ] All tests pass locally (`npm test` shows 0 failures, 0 skipped)
- [ ] Coverage meets targets (`npm run test:coverage` >80%)
- [ ] Lint passes (`npm run lint` no errors)
- [ ] Type check passes (`npm run type-check` no errors)
- [ ] Build succeeds (`npm run build` completes)
- [ ] New tests added for new functionality
- [ ] Integration tests included for API-dependent features

### Reviewer Checklist

- [ ] Verify developer confirms all local tests passed
- [ ] Review test coverage report if provided
- [ ] Check CI/CD quality gates all passed (lint, type, build)
- [ ] Validate new tests are appropriate and comprehensive
- [ ] Confirm integration tests exist for new agent/workflow features

## Troubleshooting

### Common Issues

#### Issue: Integration Tests Skipped

**Symptom**: Tests show "X skipped" in output

**Cause**: Missing API keys in `.env` file

**Solution**:
```bash
# Verify .env file exists and has keys
cat backend/.env

# If missing, create and add keys (see Environment Setup)
```

#### Issue: Git Configuration Errors

**Symptom**: Tests fail with "git config user.name" errors

**Cause**: Git user not configured

**Solution**:
```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
git config commit.gpgsign false
```

#### Issue: OOM Errors Locally

**Symptom**: Tests crash with "JavaScript heap out of memory"

**Cause**: Insufficient Node.js heap size

**Solution**:
```bash
# Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=8192"
npm test
```

#### Issue: Slow Test Execution

**Symptom**: Tests take >2 minutes to complete

**Cause**: API latency or network issues

**Solution**:
- Check internet connection
- Verify API keys are valid (expired keys cause retries)
- Run specific test files instead of full suite during development
- Use `npm run test:watch` for iterative development

#### Issue: Flaky Integration Tests

**Symptom**: Tests pass/fail intermittently

**Cause**: API rate limits or timeout issues

**Solution**:
- Wait a few minutes between test runs
- Check API provider status pages
- Review test timeout configurations (most are 30-60s)
- Report persistent flakiness to team for investigation

## Testing Guidelines for Epic 3+

### New Feature Development

When adding new features in Epic 3 and beyond:

1. **Write Tests First (TDD)**
   - Define acceptance criteria as tests
   - Write failing tests for new functionality
   - Implement feature to make tests pass

2. **Integration Test Coverage**
   - Agent personas: >80% integration test coverage
   - Workflow executors: >80% integration test coverage
   - Service integrations: >70% integration test coverage

3. **Test Organization**
   - Unit tests: `*.test.ts` (same directory as source)
   - Integration tests: `*.integration.test.ts`
   - E2E tests: `tests/e2e/*.test.ts` (Epic 5+)

### Test Naming Conventions

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do expected behavior when condition', async () => {
      // Test implementation
    });

    it('should handle error when invalid input', async () => {
      // Error case
    });
  });
});
```

## Future Considerations

### Potential CI/CD Test Re-enablement

If CI/CD resources improve or test optimization reduces memory requirements:

1. **Selective Integration Tests**: Run subset in CI/CD
2. **Parallel Job Distribution**: Split tests across multiple runners
3. **Increased Runner Resources**: Upgrade to larger GitHub Action runners
4. **Test Sharding**: Distribute test load across jobs

### Monitoring and Metrics

Track these metrics to inform future decisions:

- Local test execution time trends
- Integration test flakiness rates
- API usage and costs for integration tests
- Code review delays due to test verification

## References

- CI/CD Configuration: `.github/workflows/ci.yml`
- Testing Guide: `docs/testing-guide.md` (created in Task 2)
- Test Setup Guide: `docs/test-setup-guide.md` (if exists)
- Retrospective Epic 2: `docs/retrospective-epic-2.md` (Action Item #1)

---

**Maintained by**: Development Team
**Questions**: Ask in team chat or create issue in repo

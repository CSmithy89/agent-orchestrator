# CI/CD Secrets Management

**Date**: 2025-11-10
**Status**: Active
**Context**: Story 2.9 Task 1 (Action Item #1 - Epic 2 Retrospective)

---

## Overview

This document describes how API keys and authentication tokens are managed in the CI/CD pipeline to enable integration testing with real LLM providers.

**Problem Solved**: Epic 2 had 33 skipped integration tests due to missing API keys in CI/CD environment.

**Solution**: Configure GitHub Secrets to provide API keys securely to GitHub Actions workflows.

---

## Required Secrets

The following secrets must be configured in GitHub repository settings:

### 1. CLAUDE_CODE_OAUTH_TOKEN

**Description**: OAuth token for Claude Code subscriptions (primary authentication method)

**Format**: `sk-ant-oat01-...` (OAuth token, not API key)

**Used By**:
- ClaudeCodeProvider (primary provider for agents)
- Mary Agent integration tests
- John Agent integration tests
- DecisionEngine integration tests

**Environment Variable**: `CLAUDE_CODE_OAUTH_TOKEN`

**How to Obtain**:
1. Subscribe to Claude Code (https://claude.com/claude-code)
2. Navigate to API Keys section in Claude Code dashboard
3. Generate OAuth token (starts with `sk-ant-oat01-`)
4. Copy token immediately (won't be shown again)

### 2. ANTHROPIC_API_KEY

**Description**: Anthropic API key for direct API access (fallback/alternative)

**Format**: `sk-ant-api01-...` (API key)

**Used By**:
- AnthropicProvider (alternative provider)
- Test utilities that check for API key availability

**Environment Variable**: `ANTHROPIC_API_KEY`

**How to Obtain**:
1. Sign up at https://console.anthropic.com/
2. Navigate to API Keys section
3. Create new API key
4. Copy key immediately (won't be shown again)

**Note**: Most integration tests should use CLAUDE_CODE_OAUTH_TOKEN. This key is provided for backwards compatibility and alternative testing scenarios.

### 3. OPENAI_API_KEY

**Description**: OpenAI API key for GPT model integration

**Format**: `sk-...` (OpenAI key format)

**Used By**:
- OpenAIProvider (multi-provider support)
- Future integration tests for OpenAI models

**Environment Variable**: `OPENAI_API_KEY`

**How to Obtain**:
1. Sign up at https://platform.openai.com/
2. Navigate to API Keys section
3. Create new API key
4. Copy key immediately (won't be shown again)

**Status**: Optional for Epic 2-3, required for Epic 5 (multi-provider testing)

### 4. ZHIPU_API_KEY

**Description**: Zhipu AI API key for GLM model integration

**Format**: Zhipu-specific format

**Used By**:
- ZhipuProvider (multi-provider support)
- Future integration tests for Zhipu models

**Environment Variable**: `ZHIPU_API_KEY`

**How to Obtain**:
1. Sign up at Zhipu AI platform
2. Generate API key
3. Copy key

**Status**: Optional for Epic 2-3, required for Epic 5 (multi-provider testing)

---

## GitHub Secrets Configuration

### Step 1: Access Repository Settings

1. Navigate to: `https://github.com/CSmithy89/agent-orchestrator/settings/secrets/actions`
2. Requires repository admin access

### Step 2: Add Secrets

For each secret:

1. Click "New repository secret"
2. Enter secret name (exactly as shown above):
   - `CLAUDE_CODE_OAUTH_TOKEN`
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `ZHIPU_API_KEY`
3. Enter secret value (the actual API key/token)
4. Click "Add secret"

### Step 3: Verify Secrets

After adding secrets:

1. Navigate back to Secrets page
2. Verify all 4 secrets appear in list
3. Secrets show "Updated X time ago" timestamp
4. Secret values are hidden (show as `***`)

### Step 4: Test in Workflow

1. Push a commit to trigger CI/CD
2. Navigate to Actions tab
3. Check latest workflow run
4. Verify "Run tests with coverage" job succeeds
5. Verify 0 skipped tests (all integration tests run)

---

## CI/CD Workflow Configuration

The `.github/workflows/ci.yml` file has been updated to pass secrets as environment variables:

```yaml
jobs:
  test:
    name: Tests with Coverage
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      # ... setup steps ...

      - name: Run tests with coverage
        env:
          # Claude Code OAuth token (primary authentication)
          CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}

          # Alternative/fallback authentication
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

          # Multi-provider support (optional for Epic 2-3)
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          ZHIPU_API_KEY: ${{ secrets.ZHIPU_API_KEY }}
        run: cd backend && npm run test:coverage
```

**Key Points**:
- Secrets accessed via `${{ secrets.SECRET_NAME }}` syntax
- Environment variables set in `env:` block
- Available only to specific job step (principle of least privilege)
- Secret values never logged or exposed in output

---

## Security Best Practices

### 1. Secret Masking

GitHub Actions automatically masks secret values in logs:

```bash
# In logs, you'll see:
CLAUDE_CODE_OAUTH_TOKEN: ***

# NOT:
CLAUDE_CODE_OAUTH_TOKEN: sk-ant-oat01-actual-token-value
```

**Verification**: Check workflow logs to ensure no secret values are visible.

### 2. Access Control

**Who can access secrets:**
- Repository admins: Can read/write/delete secrets
- Workflow runs: Can access secrets via `${{ secrets.NAME }}` syntax
- Pull requests from forks: **Cannot** access secrets (security protection)

**Implications**:
- PRs from external contributors won't run integration tests
- This is intentional security behavior
- Maintainers can run tests after merging PR

### 3. Secret Rotation

**When to rotate:**
- Every 90 days (recommended)
- When team member with access leaves
- If secret exposure suspected
- After security audit

**How to rotate:**
1. Generate new API key/token from provider
2. Update GitHub Secret with new value
3. Verify CI/CD passes with new secret
4. Revoke old API key/token from provider
5. Document rotation in this guide

### 4. Least Privilege

**Current configuration:**
- Secrets only available to `test` job in CI workflow
- Not available to other jobs (lint, type-check, build)
- Only necessary secrets passed to each environment

**Future**: As more workflows are added, only pass required secrets to each workflow.

### 5. Audit Logging

GitHub provides audit logs for secret access:

1. Navigate to Settings → Audit log
2. Filter by "secret" events
3. Review secret access history
4. Investigate suspicious access patterns

---

## Integration Test Behavior

### With API Keys Available

When secrets are configured in CI/CD:

```typescript
const hasApiKeys = () => {
  return !!(process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN);
};

it('should work with Claude Code provider', async () => {
  // Test runs (not skipped)
  const mary = await MaryAgent.create(config, llmFactory);
  const result = await mary.analyzeRequirements('...');
  expect(result).toBeDefined();
});
```

**Result**: All 33 integration tests run and pass.

### Without API Keys (Before Configuration)

When secrets not configured:

```typescript
it.skipIf(!hasApiKeys())('should work with Claude Code provider', async () => {
  // Test skipped
});
```

**Result**: 33 tests skipped (4.4% of test suite).

### Local Development

Developers can run integration tests locally by creating `.env` file:

```bash
# backend/.env
CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
ANTHROPIC_API_KEY=sk-ant-api01-...
OPENAI_API_KEY=sk-...
ZHIPU_API_KEY=...
```

**Important**: `.env` file is gitignored (never committed to repository).

---

## Troubleshooting

### Problem: Tests Still Skipped in CI/CD

**Symptoms**:
- CI/CD shows "33 skipped tests"
- Logs show `hasApiKeys()` returning `false`

**Diagnosis**:
```bash
# Check if secrets are passed to workflow
echo "CLAUDE_CODE_OAUTH_TOKEN set: ${CLAUDE_CODE_OAUTH_TOKEN:+YES}"
```

**Solutions**:
1. Verify secrets exist in GitHub Settings → Secrets
2. Verify workflow has `env:` block with secret mappings
3. Verify secret names match exactly (case-sensitive)
4. Check workflow permissions (needs `contents: read`)

### Problem: Authentication Failed (401)

**Symptoms**:
- Tests run but fail with 401 authentication error
- Error: `invalid x-api-key` or `authentication_error`

**Diagnosis**:
- Secret value is incorrect or expired
- Wrong token format (API key vs OAuth token)

**Solutions**:
1. Verify token format:
   - OAuth: `sk-ant-oat01-...` (use with ClaudeCodeProvider)
   - API Key: `sk-ant-api01-...` (use with AnthropicProvider)
2. Generate new token/key from provider
3. Update GitHub Secret with new value
4. Revoke old token/key

### Problem: Rate Limiting (429)

**Symptoms**:
- Tests fail with 429 rate limit errors
- Error: `rate_limit_error`

**Solutions**:
1. Implement retry logic with exponential backoff (see `docs/async-patterns-guide.md`)
2. Use test account with higher rate limits
3. Run fewer integration tests in CI/CD (use test filters)
4. Space out test runs (add delays between requests)

### Problem: Secrets Not Available in PR from Fork

**Symptoms**:
- External contributor PR has skipped integration tests
- Logs show `hasApiKeys()` returning `false`

**This is expected behavior** (security feature):
- PRs from forks cannot access secrets
- Prevents secret theft via malicious PRs
- Maintainers can run tests after merging PR

**Workaround**:
- Maintainer creates branch in main repository
- Cherry-pick commits from fork
- Tests run with secrets available

---

## Verification Checklist

After configuring secrets, verify:

- [ ] All 4 secrets configured in GitHub Settings → Secrets
- [ ] Workflow file updated with `env:` block (commit 9e7399e or later)
- [ ] CI/CD pipeline triggered (push commit or re-run workflow)
- [ ] Test job shows environment variables set (check logs)
- [ ] All tests passing (0 failures, 0 skipped)
- [ ] Coverage report generated
- [ ] No secret values visible in logs

---

## Maintenance

### Quarterly Review (Every 90 Days)

- [ ] Rotate all API keys/tokens
- [ ] Review secret access audit logs
- [ ] Verify secrets still valid (test in CI/CD)
- [ ] Update this documentation if changes needed

### When Team Changes

**New team member with CI/CD access**:
- [ ] No action needed (secrets managed at repo level)

**Team member leaves**:
- [ ] Rotate all secrets immediately
- [ ] Review audit logs for their access
- [ ] Verify new secrets work in CI/CD

---

## References

- **Epic 2 Retrospective**: `docs/retrospective-epic-2.md` - Action Item #1
- **Story 2.9**: `docs/stories/2-9-technical-debt-resolution.md` - Task 1
- **CI Workflow**: `.github/workflows/ci.yml`
- **OAuth Pattern Guide**: `docs/llm-provider-patterns.md`
- **GitHub Docs**: https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-10 | Initial secrets management documentation (Story 2.9 Task 1) |

---

**Maintained by**: DevOps Lead / Scrum Master
**Next Review**: 2025-02-10 (90 days)
**Status**: Active - Apply to all CI/CD workflows

---

## Action Items

### Immediate (Required for Task 1 Completion)

- [ ] Configure 4 secrets in GitHub repository settings
- [ ] Update `.github/workflows/ci.yml` with environment variables
- [ ] Push workflow update and verify tests run
- [ ] Confirm 0 skipped tests in CI/CD output

### Post-Epic 3

- [ ] Add OPENAI_API_KEY when OpenAI integration tests added
- [ ] Add ZHIPU_API_KEY when Zhipu integration tests added
- [ ] Document additional secrets as needed
- [ ] Implement secret rotation schedule

# CI/CD Pipeline Documentation

**Agent Orchestrator Continuous Integration**

This document describes the CI/CD pipeline configuration, execution flow, and operational procedures for the Agent Orchestrator project.

---

## Overview

**Platform**: GitHub Actions  
**Configuration**: `.github/workflows/test.yml`  
**Triggers**: Push to main/develop, pull requests, manual dispatch

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Test Pipeline                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Stage 1: Lint                                          │
│  ├─ ESLint                                              │
│  ├─ Prettier                                            │
│  └─ Type checking                                       │
│                                                          │
│  Stage 2: Unit & Integration Tests (Parallel)           │
│  ├─ Backend workspace tests                             │
│  └─ Dashboard workspace tests                           │
│                                                          │
│  Stage 3: E2E Tests (4 parallel shards)                 │
│  ├─ Shard 1/4                                           │
│  ├─ Shard 2/4                                           │
│  ├─ Shard 3/4                                           │
│  └─ Shard 4/4                                           │
│                                                          │
│  Stage 4: Burn-In (PRs to main only)                    │
│  └─ 10 iterations for flaky detection                   │
│                                                          │
│  Stage 5: Report                                        │
│  └─ Aggregate results & generate summary                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Targets

| Stage | Target Time | Optimization Strategy |
|-------|-------------|----------------------|
| Lint | <2 min | Minimal dependencies, cached |
| Unit Tests | <10 min | Workspace parallelism |
| E2E Tests | <10 min/shard | 4-way sharding |
| Burn-in | <30 min | Chromium-only, conditional |
| **Total** | **<45 min** | Parallel execution + caching |

**Speedup**: 20× faster than sequential execution

---

## Running Locally

### Full CI Pipeline

```bash
./scripts/ci-local.sh
```

Runs all stages sequentially:
1. Lint
2. Unit tests (both workspaces)
3. E2E tests
4. Burn-in (3 iterations)

### Individual Stages

**Lint only**:
```bash
npm run lint
```

**Unit tests**:
```bash
npm run test --workspaces
# Or specific workspace:
npm run test --workspace=backend
```

**E2E tests**:
```bash
npm run test:e2e
```

**Burn-in loop**:
```bash
./scripts/burn-in.sh
# Or with custom iterations:
BURN_IN_ITERATIONS=5 ./scripts/burn-in.sh
```

**Selective testing** (changed files only):
```bash
./scripts/test-changed.sh
```

---

## Parallel Sharding

E2E tests are split into 4 parallel shards for fast execution.

**How it works**:
```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]

run: npm run test:e2e -- --shard=${{ matrix.shard }}/4
```

**Benefits**:
- 4× faster execution
- Isolated test runs
- Better failure visibility

**Trade-offs**:
- Uses 4 concurrent runners
- Slightly more setup overhead

---

## Burn-In Loop

**Purpose**: Detect flaky (non-deterministic) tests before they reach main branch.

**Execution**:
- Runs E2E tests 10 times sequentially
- Even ONE failure → test is flaky
- Only runs on PRs to main branch

**When it runs**:
- ✅ Pull requests to `main`
- ✅ Manual workflow dispatch with burn-in enabled
- ❌ Regular pushes to develop (too slow)

**Customizing iterations**:

Edit `.github/workflows/test.yml`:
```yaml
- name: Run burn-in loop (10 iterations)
  run: ./scripts/burn-in.sh
  env:
    BURN_IN_ITERATIONS: 10  # Change to 3, 5, 100, etc.
```

---

## Artifact Collection

**Strategy**: Upload artifacts only on failure (saves storage costs)

### What Gets Uploaded

**E2E Test Failures** (`e2e-results-shard-N`):
- `test-results/` - Raw test results
- `playwright-report/` - HTML report
- Screenshots, videos, traces

**Burn-In Failures** (`burn-in-failures`):
- Complete test results from failed iteration
- Trace files for debugging

**Coverage Reports** (`coverage-{workspace}`):
- Uploaded on every run
- 30-day retention

### Downloading Artifacts

1. Go to failed workflow run
2. Scroll to "Artifacts" section
3. Download `e2e-results-shard-N` or `burn-in-failures`
4. Extract and view:
   ```bash
   unzip e2e-results-shard-1.zip
   npx playwright show-trace test-results/*/trace.zip
   ```

---

## Caching Strategy

### NPM Dependencies

```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'
```

**Key**: `${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}`  
**Savings**: 2-3 minutes per run

### Playwright Browsers

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
```

**Key**: `${{ runner.os }}-playwright-${{ hashFiles('**/package-lock.json') }}`  
**Savings**: 1-2 minutes per run

**Total cache savings**: 3-5 minutes per pipeline run

---

## Debugging Failed CI Runs

### Step 1: Check Job Summary

GitHub Actions provides an auto-generated summary showing which stage failed.

### Step 2: Download Artifacts

```bash
# From GitHub UI or using gh CLI:
gh run download <run-id> --name e2e-results-shard-1
```

### Step 3: View Trace

```bash
npx playwright show-trace test-results/*/trace.zip
```

Trace viewer shows:
- Full interaction timeline
- Network requests
- Console logs
- Screenshots at each step
- DOM snapshots

### Step 4: Reproduce Locally

```bash
# Run the same shard that failed:
npm run test:e2e -- --shard=1/4

# Or specific test:
npm run test:e2e -- --grep "test name"

# With debug mode:
npm run test:e2e:debug
```

### Step 5: Common Failure Patterns

**"Element not found"**:
- Add explicit waits: `await page.locator(...).waitFor()`
- Check selector accuracy

**"Timeout"**:
- Increase timeout in `playwright.config.ts`
- Check if backend is running

**"Flaky test"** (passes locally, fails in CI):
- Run burn-in locally: `BURN_IN_ITERATIONS=10 ./scripts/burn-in.sh`
- Check for race conditions
- Ensure proper cleanup between tests

---

## Selective Testing

For faster feedback on small PRs, use selective testing:

```bash
./scripts/test-changed.sh
```

**Logic**:
- Detects changed files vs main branch
- Runs only affected test suites
- Falls back to full suite if critical paths change

**Use cases**:
- Documentation-only changes (skip tests)
- Backend-only changes (skip dashboard tests)
- Focused PRs (50-80% time savings)

**Limitations**:
- May miss integration issues
- Full suite still runs on main branch merge

---

## Status Badges

Add to `README.md`:

```markdown
[![Test Pipeline](https://github.com/{org}/{repo}/actions/workflows/test.yml/badge.svg)](https://github.com/{org}/{repo}/actions/workflows/test.yml)
```

Replace `{org}` and `{repo}` with your GitHub organization and repository name.

---

## Configuring Notifications (Optional)

### Slack Notifications

1. Create Slack webhook: https://api.slack.com/messaging/webhooks

2. Add secret to GitHub:
   - Go to Settings → Secrets → New repository secret
   - Name: `SLACK_WEBHOOK`
   - Value: Your webhook URL

3. Add notification step to `.github/workflows/test.yml`:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Test failures in PR #${{ github.event.pull_request.number }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## Maintenance

### Weekly Tasks

- Review burn-in results for patterns
- Check artifact storage usage
- Update dependencies in workflow

### Monthly Tasks

- Review pipeline performance metrics
- Optimize slow tests
- Update action versions

### Quarterly Tasks

- Review caching strategy effectiveness
- Adjust shard count based on test suite size
- Update documentation

---

## Troubleshooting

### "npm ci failed"

**Cause**: package-lock.json out of sync  
**Fix**: `npm install` locally and commit updated lockfile

### "Playwright browsers not installed"

**Cause**: Cache miss or version change  
**Fix**: Workflow auto-installs, but check cache key

### "Tests pass locally but fail in CI"

**Causes**:
- Environment differences (ports, paths)
- Timing/race conditions
- Missing environment variables

**Debug**:
1. Check CI environment variables
2. Run burn-in locally
3. Match Node version (.nvmrc)

### "Burn-in takes too long"

**Options**:
- Reduce iterations to 5 or 3
- Run burn-in on schedule instead of every PR
- Optimize slow tests

---

## CI Platform Settings

### Required Secrets

See [`ci-secrets-checklist.md`](./ci-secrets-checklist.md) for complete list.

### GitHub Actions Settings

- **Workflow permissions**: Read and write (for artifacts)
- **Artifact retention**: 30 days (configurable)
- **Concurrent workflows**: Unlimited (or set limit)

---

## Performance Optimization Tips

1. **Reduce Test Count**: Aim for 60% unit, 30% integration, 10% E2E
2. **Parallel Sharding**: Adjust shard count (4 is optimal for most repos)
3. **Selective Testing**: Use for focused PRs
4. **Caching**: Ensure cache hits (check keys)
5. **Artifact Size**: Upload failures only, compress when possible

---

**Last Updated**: 2025-11-04  
**Maintainer**: TEA Agent (Murat)  
**Related Docs**: [`tests/README.md`](../tests/README.md), [`ci-secrets-checklist.md`](./ci-secrets-checklist.md)

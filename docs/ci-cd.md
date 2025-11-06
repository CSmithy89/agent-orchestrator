# CI/CD Pipeline Documentation

## Overview

The Agent Orchestrator uses GitHub Actions for continuous integration and deployment. The CI pipeline automatically runs tests, linting, type checking, and builds on every push and pull request to ensure code quality.

## Pipeline Configuration

**Workflow File**: `.github/workflows/ci.yml`

### Triggers

The CI pipeline runs on:
- **Push events** to `main`, `develop`, and `claude/**` branches
- **Pull request events** targeting `main` or `develop` branches
- **Manual triggers** via `workflow_dispatch`

### Jobs

The pipeline consists of four parallel/sequential jobs:

#### 1. Test Job (Parallel)
- **Runs**: Tests with coverage reporting
- **Node.js**: 20.x LTS
- **Commands**: `npm ci && npm run test:coverage`
- **Artifacts**: Coverage reports uploaded for review
- **Coverage Threshold**: 80% minimum (enforced by Vitest)
- **Timeout**: 10 minutes

#### 2. Lint Job (Parallel)
- **Runs**: ESLint code quality checks
- **Node.js**: 20.x LTS
- **Commands**: `npm ci && npm run lint`
- **Timeout**: 5 minutes

#### 3. Type Check Job (Parallel)
- **Runs**: TypeScript type checking
- **Node.js**: 20.x LTS
- **Commands**: `npm ci && npm run type-check`
- **Timeout**: 5 minutes

#### 4. Build Job (Sequential - after tests pass)
- **Runs**: Backend build verification
- **Node.js**: 20.x LTS
- **Commands**: `npm ci && npm run build`
- **Validates**: `dist/` output directory created
- **Note**: Frontend build placeholder for Epic 6
- **Timeout**: 5 minutes

## Performance

### Target
- **Goal**: Complete pipeline in < 5 minutes for typical changes
- **Current**: ~2-3 minutes with caching, ~4-5 minutes without

### Optimization Strategies

1. **Dependency Caching**: Node modules cached based on `package-lock.json` hash
2. **Parallel Execution**: Test, lint, and type-check run simultaneously
3. **npm ci**: Fast, deterministic installs (vs npm install)
4. **Build Sequencing**: Build only runs after quality checks pass

## Coverage Requirements

### Thresholds
The pipeline enforces **80% minimum coverage** across:
- Lines
- Functions
- Branches
- Statements

### How It Works
1. Tests run with `npm run test:coverage`
2. Vitest calculates coverage using v8 provider
3. Coverage thresholds configured in `backend/vitest.config.ts`
4. Pipeline **fails** if coverage < 80%
5. Coverage reports uploaded as artifacts

### Viewing Coverage
- **Local**: `cd backend && npm run test:coverage`
- **CI**: Download coverage artifacts from workflow run
- **Reports**: HTML report in `backend/coverage/index.html`

## Running CI Locally

To run the same checks CI performs:

```bash
# Navigate to backend
cd backend

# Install dependencies (like CI)
npm ci

# Run all quality checks
npm run test:coverage  # Tests + coverage
npm run lint           # Linting
npm run type-check     # Type checking
npm run build          # Build verification
```

### Quick Check Script
```bash
#!/bin/bash
# run-ci-checks.sh
cd backend
npm ci
npm run lint && \
npm run type-check && \
npm run test:coverage && \
npm run build
```

## Debugging CI Failures

### Test Failures

**Symptom**: Test job fails
**Check**:
1. Review test output in workflow logs
2. Run tests locally: `npm run test:coverage`
3. Check for environment differences (Node version, dependencies)
4. Look for flaky tests (intermittent failures)

**Fix**:
1. Fix failing tests locally
2. Ensure coverage stays ≥ 80%
3. Commit and push

### Coverage Below Threshold

**Symptom**: Tests pass but coverage job fails
**Message**: "ERROR: Coverage for lines (XX%) does not meet threshold (80%)"

**Fix**:
1. Run `npm run test:coverage` locally
2. Review coverage report: `open backend/coverage/index.html`
3. Add tests for uncovered code
4. Re-run until coverage ≥ 80%

### Lint Failures

**Symptom**: Lint job fails
**Check**:
1. Review ESLint errors in workflow logs
2. Run locally: `npm run lint`

**Fix**:
1. Auto-fix where possible: `npm run lint -- --fix`
2. Manually fix remaining issues
3. Commit and push

### Type Check Failures

**Symptom**: Type-check job fails
**Check**:
1. Review TypeScript errors in workflow logs
2. Run locally: `npm run type-check`

**Fix**:
1. Fix type errors in reported files
2. Ensure proper type annotations
3. Commit and push

### Build Failures

**Symptom**: Build job fails
**Check**:
1. Review build output in workflow logs
2. Run locally: `npm run build`

**Fix**:
1. Fix TypeScript compilation errors
2. Ensure all imports/exports correct
3. Verify `dist/` directory created
4. Commit and push

### Dependency Installation Failures

**Symptom**: `npm ci` fails
**Common Causes**:
- package-lock.json out of sync with package.json
- Network issues
- Registry problems

**Fix**:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` locally
3. Commit updated `package-lock.json`
4. Push and retry

## Common CI Issues

### Issue: "This job took longer than X minutes"
**Cause**: Job exceeded timeout limit
**Fix**:
- Optimize slow tests
- Check for infinite loops or hanging operations
- Increase timeout if legitimately needed

### Issue: "No tests found"
**Cause**: Test files not matched or wrong directory
**Fix**:
- Verify test files end with `.test.ts` or `.spec.ts`
- Check Vitest configuration in `vitest.config.ts`
- Ensure tests are in `backend/tests/` directory

### Issue: "Module not found"
**Cause**: Missing dependency or incorrect import
**Fix**:
- Verify dependency in `package.json`
- Check import paths (relative vs absolute)
- Run `npm ci` to ensure clean install

### Issue: "EACCES: permission denied"
**Cause**: File permission issues
**Fix**:
- Check file permissions in repository
- Ensure no OS-specific permission requirements
- Use `chmod +x` for executable scripts

## Status Badges

The README displays two status badges:

1. **CI Status**: ![CI Status](https://github.com/CSmithy89/agent-orchestrator/actions/workflows/ci.yml/badge.svg)
   - Shows: ✅ passing | ❌ failing | 🟡 in progress
   - Updates: Automatically after each workflow run

2. **Coverage**: ![Coverage](https://img.shields.io/badge/coverage-%E2%89%A580%25-brightgreen)
   - Shows: Current coverage percentage
   - Updates: After coverage reports uploaded
   - Note: Static badge showing minimum threshold

## Branch Protection

### Recommended Settings
To enforce CI checks before merging:

1. Go to repository Settings → Branches
2. Add branch protection rule for `main` and `develop`
3. Enable:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Select required status checks:
   - ✅ Tests with Coverage
   - ✅ Lint Check
   - ✅ Type Check
   - ✅ Build Verification

This prevents merging PRs with:
- Failing tests
- Coverage < 80%
- Lint errors
- Type errors
- Build failures

## Matrix Testing

**Current Configuration**: Single Node.js version (20.x LTS)

**Rationale**:
- Project targets Node.js 20.x specifically per tech spec
- New project, no legacy version support needed
- Single version keeps pipeline under 5-minute target
- Can add matrix later if multi-version support needed

**To Add Multi-Version Testing** (if needed):
```yaml
strategy:
  matrix:
    node-version: [20.x, 22.x]
steps:
  - uses: actions/setup-node@v4
    with:
      node-version: ${{ matrix.node-version }}
```

## Best Practices

### DO:
✅ Write tests for all new features
✅ Maintain ≥ 80% code coverage
✅ Fix CI failures immediately
✅ Run checks locally before pushing
✅ Use `npm ci` in CI (not `npm install`)
✅ Cache dependencies for speed
✅ Set reasonable timeouts (5-10 min)
✅ Keep builds fast (< 5 min total)

### DON'T:
❌ Push without running tests locally
❌ Ignore CI failures
❌ Skip lint or type-check fixes
❌ Commit with coverage < 80%
❌ Use `npm install` in CI
❌ Run sequential jobs that could be parallel
❌ Merge PRs with failing CI

## Troubleshooting Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Vitest Coverage**: https://vitest.dev/guide/coverage
- **ESLint Rules**: https://eslint.org/docs/latest/rules/
- **TypeScript Compiler**: https://www.typescriptlang.org/docs/handbook/compiler-options.html

## Future Enhancements

Planned for future epics:
- **Epic 6**: Frontend build and testing
- **Coverage Badges**: Dynamic badges via Codecov
- **Deploy Jobs**: Automatic deployment to staging/production
- **Notification**: Slack/Discord notifications on failures
- **Security Scans**: Snyk/Dependabot integration

---

**Last Updated**: 2025-11-06
**Story**: 1.12 - CI/CD Pipeline Configuration

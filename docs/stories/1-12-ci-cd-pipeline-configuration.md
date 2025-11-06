# Story 1.12: CI/CD Pipeline Configuration

Status: drafted

## Story

As a development team,
I want automated CI/CD pipelines configured with GitHub Actions,
So that code quality is enforced through automated testing, linting, and build verification on every commit and pull request.

## Acceptance Criteria

1. Create GitHub Actions workflow configuration (.github/workflows/ci.yml)
2. Configure automated test execution on push and pull request events
3. Setup automated linting and type checking in CI pipeline
4. Configure build verification for backend and frontend workspaces
5. Integrate code coverage reporting with threshold enforcement (80% minimum)
6. Setup test result caching for faster CI runs
7. Configure matrix testing for multiple Node.js versions (if needed)
8. Ensure CI pipeline completes in <5 minutes for typical changes
9. Add status badges to README.md showing CI and coverage status

## Tasks / Subtasks

- [ ] **Task 1**: Create GitHub Actions workflow structure (AC: #1)
  - [ ] Create .github/workflows/ directory
  - [ ] Create ci.yml workflow file with proper YAML structure
  - [ ] Configure workflow name and triggers (push, pull_request)
  - [ ] Define target branches (main, develop, feature branches)
  - [ ] Setup workflow permissions (read for contents, write for checks)
  - [ ] Add workflow_dispatch for manual triggers

- [ ] **Task 2**: Configure test job (AC: #2, #5)
  - [ ] Define test job with ubuntu-latest runner
  - [ ] Checkout code with actions/checkout@v4
  - [ ] Setup Node.js with actions/setup-node@v4
  - [ ] Configure Node.js version (20.x as specified in tech spec)
  - [ ] Setup caching for npm dependencies
  - [ ] Install dependencies (npm ci for backend workspace)
  - [ ] Run tests with coverage (npm run test:coverage)
  - [ ] Upload coverage reports as artifacts
  - [ ] Enforce 80% coverage threshold (fail if below)
  - [ ] Generate coverage summary for PR comments

- [ ] **Task 3**: Configure lint and type-check jobs (AC: #3)
  - [ ] Create lint job separate from test job
  - [ ] Setup Node.js and dependencies
  - [ ] Run ESLint (npm run lint)
  - [ ] Create type-check job
  - [ ] Run TypeScript compiler (npm run type-check)
  - [ ] Configure both jobs to run in parallel with test job
  - [ ] Ensure lint and type-check failures block PR merge

- [ ] **Task 4**: Configure build verification jobs (AC: #4)
  - [ ] Create build-backend job
  - [ ] Setup Node.js and install dependencies
  - [ ] Run backend build (npm run build in backend workspace)
  - [ ] Verify dist/ output created successfully
  - [ ] Create build-frontend job (placeholder for future)
  - [ ] Add note that frontend build will be activated in Epic 6
  - [ ] Configure builds to run after test/lint jobs pass

- [ ] **Task 5**: Optimize CI performance (AC: #6, #8)
  - [ ] Implement dependency caching with cache key based on lock file
  - [ ] Configure test result caching (if supported by Vitest)
  - [ ] Use npm ci instead of npm install for faster, deterministic installs
  - [ ] Enable parallel job execution where possible
  - [ ] Configure timeout limits (10 minutes max per job)
  - [ ] Measure and optimize total pipeline duration (<5 minutes target)

- [ ] **Task 6**: Matrix testing configuration (AC: #7)
  - [ ] Evaluate need for multi-version Node.js testing
  - [ ] If needed, configure matrix strategy with Node.js versions [20.x, 22.x]
  - [ ] Otherwise, document decision to test single version (20.x LTS)
  - [ ] Configure matrix to run tests in parallel across versions
  - [ ] Ensure all matrix jobs must pass for overall success

- [ ] **Task 7**: Add status badges and documentation (AC: #9)
  - [ ] Generate GitHub Actions status badge URL
  - [ ] Add CI status badge to README.md
  - [ ] Generate coverage badge (via shields.io or codecov)
  - [ ] Add coverage status badge to README.md
  - [ ] Document CI pipeline in README.md or docs/ci-cd.md:
    - What runs on each trigger
    - How to run CI locally
    - How to debug CI failures
    - Coverage threshold requirements
  - [ ] Add troubleshooting section for common CI issues

- [ ] **Task 8**: Validate and test CI pipeline
  - [ ] Create test branch to validate workflow
  - [ ] Push commit to trigger CI pipeline
  - [ ] Verify all jobs execute successfully
  - [ ] Verify test coverage enforcement works
  - [ ] Verify lint failures block pipeline
  - [ ] Verify build failures block pipeline
  - [ ] Test PR workflow (create test PR, verify checks run)
  - [ ] Verify pipeline completes within time target (<5 minutes)
  - [ ] Fix any issues discovered during validation

## Dev Notes

### Architecture Context

This story implements the **CI/CD Pipeline Configuration** component from Epic 1 tech spec (Section: Test Infrastructure - Story 1.12). The CI/CD pipeline automates quality gates and ensures code changes meet standards before merging.

**Key Design Decisions:**
- GitHub Actions chosen for native GitHub integration, free for public repos
- Separate jobs for test, lint, type-check, build for parallel execution
- Coverage threshold enforcement at pipeline level (80% minimum)
- Fast feedback through caching and parallel jobs (<5 minutes target)
- Status badges for visibility on repository

[Source: docs/tech-spec-epic-1.md#Test-Infrastructure]

### Tech Stack Alignment

**CI/CD Technology Stack:**
- GitHub Actions (native CI/CD)
- Node.js 20.x LTS (as specified in Epic 1)
- Ubuntu latest runners
- Actions ecosystem:
  - actions/checkout@v4 - Code checkout
  - actions/setup-node@v4 - Node.js setup
  - actions/cache@v3 - Dependency caching
  - actions/upload-artifact@v3 - Coverage upload

[Source: docs/tech-spec-epic-1.md#Dependencies-and-Integrations]

### Project Structure Notes

**CI/CD Directory Structure:**
```
agent-orchestrator/
├── .github/
│   └── workflows/
│       └── ci.yml                        ← This story
├── backend/
│   ├── package.json                      ← Scripts: test, lint, type-check, build
│   ├── vitest.config.ts                  ← Coverage configuration
│   └── tests/                            ← Test suite
├── README.md                             ← Status badges (updated)
└── docs/
    └── ci-cd.md                          ← CI/CD documentation (optional)
```

[Source: docs/tech-spec-epic-1.md#Test-Strategy-Summary]

### GitHub Actions Workflow Structure

**ci.yml Structure:**
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - uses: actions/upload-artifact@v3
        with:
          name: coverage
          path: backend/coverage/

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run type-check

  build:
    runs-on: ubuntu-latest
    needs: [test, lint, type-check]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
```

### CI/CD Best Practices

**DO:**
- Use actions/checkout@v4 with full git history for accurate coverage
- Use npm ci for deterministic, fast installs (not npm install)
- Cache node_modules with actions/cache for faster subsequent runs
- Run lint, test, type-check in parallel for speed
- Upload test results and coverage as artifacts
- Use matrix strategy only if testing multiple Node.js versions needed
- Set reasonable timeouts (10 minutes max per job)
- Document CI requirements in README

**DON'T:**
- Run sequential jobs that could run in parallel
- Install dependencies multiple times without caching
- Use npm install (slower, less reliable than npm ci)
- Ignore CI failures (every check must pass)
- Skip coverage threshold enforcement
- Run unnecessary jobs on every commit

[Source: docs/tech-spec-epic-1.md#Testing-Best-Practices]

### Performance Optimization

**Target**: <5 minutes total pipeline duration

**Optimization Strategies:**
1. **Dependency Caching**: Cache node_modules based on package-lock.json hash
2. **Parallel Jobs**: Run test, lint, type-check simultaneously
3. **Smart Triggers**: Only run on relevant branches
4. **Artifact Caching**: Cache test results if possible
5. **Minimal Installs**: Use npm ci with --ignore-scripts if safe

**Measurement**:
- Track pipeline duration via GitHub Actions UI
- Identify slow jobs and optimize individually
- Consider splitting large test suites if needed

### Coverage Threshold Enforcement

**Configuration in vitest.config.ts:**
```typescript
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

**CI Integration:**
- Vitest will exit with error code if coverage below 80%
- GitHub Actions job will fail on non-zero exit code
- PR merge will be blocked by required check

### Status Badges

**GitHub Actions Badge:**
```markdown
![CI Status](https://github.com/CSmithy89/agent-orchestrator/actions/workflows/ci.yml/badge.svg)
```

**Coverage Badge (via shields.io):**
```markdown
![Coverage](https://img.shields.io/badge/coverage-XX%25-brightgreen)
```

**Alternative**: Use codecov.io for automatic coverage badge generation

### References

- **Epic Tech Spec**: [docs/tech-spec-epic-1.md](../tech-spec-epic-1.md#Test-Infrastructure)
- **Story Source**: [docs/epics.md](../epics.md)
- **Prerequisites**: Story 1.11 (Test Framework Setup & Infrastructure)
- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Actions Marketplace**: https://github.com/marketplace?type=actions

### Dependencies

**Prerequisites:**
- Story 1.11: Test framework configured with coverage thresholds
- Story 1.1: Project structure with package.json scripts
- GitHub repository with Actions enabled

**Enables:**
- Automated quality gates for all future development
- Confidence in code changes through automated testing
- Protection of main branch via required status checks

### Learnings from Previous Story

**From Story 1.11: Test Framework Setup & Infrastructure (Status: backlog)**

Story 1.11 has not yet been implemented, but expected deliverables include:

**Expected from Story 1.11:**
- ✅ Vitest configured with coverage thresholds (80%)
- ✅ Test scripts in package.json: test, test:watch, test:coverage
- ✅ Coverage configuration with c8 or v8 provider
- ✅ Test utilities and fixtures established
- ✅ All existing tests running successfully (39+ tests)

**Integration Points:**
- CI pipeline will call npm run test:coverage from Story 1.11
- Coverage thresholds from vitest.config.ts will be enforced
- Test framework must be working before CI can validate it

**Dependency:**
- Must implement Story 1.11 first, or CI pipeline will fail
- Can draft this story now, but implementation blocked until 1.11 done

[Source: docs/stories/1-11-test-framework-setup-infrastructure.md]

## Dev Agent Record

### Context Reference

- Story Context XML will be generated by story-context workflow

### Agent Model Used

- TBD (will be assigned when story moves to in-progress)

### Debug Log References

- TBD (will be populated during implementation)

### Completion Notes List

- TBD (will be populated during implementation)

### File List

**Expected Files to Create:**
- .github/workflows/ci.yml

**Expected Files to Modify:**
- README.md (add status badges)
- docs/ci-cd.md (optional CI/CD documentation)
- docs/sprint-status.yaml (status: backlog → drafted → ready-for-dev)

---

## Senior Developer Review (AI)

**Reviewer:** TBD
**Date:** TBD
**Outcome:** TBD

Story is drafted and ready for review workflow after implementation.

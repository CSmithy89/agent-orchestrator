# Story 2.9: Technical Debt Resolution - Epic 1 & 2 Action Items

Status: drafted

## Story

As a development team,
I want to resolve accumulated technical debt from Epic 1 and Epic 2,
So that Epic 3 can proceed with a stable, well-documented, and quality-assured foundation.

## Context

**Epic 2 Retrospective** identified 9 action items. Action Item #9 (OAuth authentication pattern) was completed immediately post-epic. The remaining 8 items represent accumulated technical debt that must be addressed before Epic 3 begins.

**Critical Finding**: Epic 2 bypassed code review for 2 stories, ignored all 7 Epic 1 action items, and has 33 skipped integration tests (4.4% of test suite). Epic 3 will compound these issues if not resolved.

**Blocking Status**: The retrospective recommends **BLOCKING EPIC 3 START** until action items #1-3 are resolved.

**References**:
- `docs/retrospective-epic-1.md` - 7 action items from Epic 1
- `docs/retrospective-epic-2.md` - 9 action items from Epic 2 (1 complete, 8 pending)

## Acceptance Criteria

### CRITICAL - Blocking Epic 3 Start

1. **CI/CD API Key Management Resolved** (Action Item #1)
   - GitHub Secrets configured for ANTHROPIC_API_KEY, OPENAI_API_KEY, ZHIPU_API_KEY, CLAUDE_CODE_OAUTH_TOKEN
   - All 33 skipped integration tests now run in CI/CD
   - 0 skipped tests in CI/CD pipeline (except explicitly documented exceptions)
   - Mary Agent integration tests pass in CI/CD
   - Secrets management approach documented in `docs/ci-secrets-management.md`

2. **Standard Test Configuration Documented** (Action Item #2)
   - `docs/testing-guide.md` created with:
     - Standard git configuration for tests
     - Fork pool configuration patterns
     - Async pattern testing strategies
     - Common test pitfalls and solutions
   - Shared test utilities extracted to `backend/tests/utils/`:
     - `hasApiKeys()` helper
     - Mock agent factories
     - Git setup utilities
     - Common test fixtures
   - No duplicate test utilities across test files
   - Testing guide referenced in PR review template

3. **Code Review Process Restored** (Action Item #3)
   - GitHub branch protection enabled on `main` branch:
     - Require pull request reviews before merging
     - Require at least 1 approval
     - Dismiss stale pull request approvals when new commits are pushed
   - `docs/definition-of-done.md` updated with PR requirement:
     - "Create PR and obtain approval" added to story DoD checklist
   - Team commitment documented: 100% PR review for Epic 3 stories
   - No direct commits to `main` possible (branch protection enforced)

### HIGH Priority - Complete Before Epic 3 Phase 2

4. **Async Pattern Guidelines Verified/Updated** (Action Item #4)
   - Review existing `docs/async-patterns-guide.md` for completeness
   - Add missing examples from Epic 1-2 fixes:
     - `fs.accessSync` → `fs.access` conversion
     - Promise handling patterns
     - Error handling in async contexts
     - Testing async code
   - Create code review checklist for async patterns
   - Add checklist to PR review template
   - Verify no async-related bugs in Epic 2 codebase

5. **Epic 1 Deferred Work Reviewed and Planned** (Action Item #5)
   - Story 1.10 deferred integration tasks reviewed:
     - LLM provider integration status
     - Agent communication patterns
     - State manager integration completeness
     - Real API integration test coverage
   - Decision documented for each deferred task:
     - Address now (add to sprint)
     - Defer to Epic 4 (document in backlog)
     - Won't-do (document rationale)
   - `docs/sprint-status.yaml` updated with decisions
   - No uncertainty about technical debt from Epic 1

6. **Integration Testing Strategy Documented** (Action Item #6)
   - `docs/integration-testing-strategy.md` created with:
     - Real vs mocked LLM provider approach
     - API key dependency strategy
     - Integration test coverage targets by component
     - Integration test template for agent personas
     - CI/CD integration test execution plan
   - Strategy document influences Epic 3 test design
   - Winston/Murat agent test plans reference this strategy

### MEDIUM Priority - Ongoing Improvements

7. **Shared Test Utilities Extracted** (Action Item #7)
   - `backend/tests/utils/` directory created
   - Shared helpers extracted:
     - `hasApiKeys.ts` - API key availability check
     - `mockAgents.ts` - Mock agent factories
     - `testHelpers.ts` - Common test utilities
     - `fixtures.ts` - Shared test data
   - Duplicate test code refactored:
     - `hasApiKeys` usage in `mary-agent.test.ts` uses shared utility
     - Other duplicates identified and refactored
   - Test utilities documented in `docs/testing-guide.md`
   - New tests reuse shared utilities

8. **Documentation Tracking Improvement Implemented** (Action Item #8)
   - Option A (Process): End-of-story documentation review added to DoD checklist
   - Option B (Tooling): Task checkbox sync tooling implemented
   - Stories 2.7 and 2.8 documentation reviewed for accuracy
   - No checkbox/completion mismatches in Epic 2 stories
   - Process documented for Epic 3 stories

## Tasks / Subtasks

### Phase 1: Critical Blocking Items (11-16 hours)

#### Task 1: Configure CI/CD API Key Management (4-6 hours) - Action Item #1

- [ ] **Research GitHub Secrets Configuration**
  - [ ] Review GitHub Actions secrets documentation
  - [ ] Review existing CI/CD workflow files in `.github/workflows/`
  - [ ] Determine which workflows need API keys
  - [ ] Document secret rotation strategy

- [ ] **Configure GitHub Secrets**
  - [ ] Add `ANTHROPIC_API_KEY` to GitHub repository secrets
  - [ ] Add `OPENAI_API_KEY` to GitHub repository secrets
  - [ ] Add `ZHIPU_API_KEY` to GitHub repository secrets
  - [ ] Add `CLAUDE_CODE_OAUTH_TOKEN` to GitHub repository secrets
  - [ ] Verify secrets are accessible to workflows

- [ ] **Update CI/CD Workflows**
  - [ ] Modify test workflow to use secrets as environment variables
  - [ ] Add secret validation step (check keys are not empty)
  - [ ] Configure test execution to enable integration tests
  - [ ] Update workflow documentation

- [ ] **Enable Integration Tests in CI/CD**
  - [ ] Remove `skipIf` conditions that check for API keys
  - [ ] OR configure environment to set API key availability flags
  - [ ] Verify 33 skipped tests now run
  - [ ] Run full CI/CD pipeline to verify

- [ ] **Document Secrets Management**
  - [ ] Create `docs/ci-secrets-management.md`
  - [ ] Document which secrets are configured
  - [ ] Document how to rotate secrets
  - [ ] Document troubleshooting for secret-related failures
  - [ ] Document security best practices

- [ ] **Verify Integration Tests Pass**
  - [ ] Run Mary Agent integration tests in CI/CD
  - [ ] Verify 0 skipped tests (except documented exceptions)
  - [ ] Verify all integration tests pass
  - [ ] Document test execution results

#### Task 2: Document Standard Test Configuration (6-8 hours) - Action Item #2

- [ ] **Create Testing Guide**
  - [ ] Create `docs/testing-guide.md`
  - [ ] Document standard git configuration for tests:
    - `user.name`, `user.email` setup
    - `commit.gpgsign` disabling for tests
    - Fork pool configuration patterns
  - [ ] Document async pattern testing strategies:
    - Testing async functions
    - Testing promise handling
    - Testing error cases
    - Testing timeouts
  - [ ] Document common test pitfalls:
    - Epic 1.11 git signing issue
    - Story 2.8 WorkflowParser concurrency issue
    - API key dependency handling
    - Test isolation concerns

- [ ] **Extract Shared Test Utilities**
  - [ ] Create `backend/tests/utils/` directory
  - [ ] Extract `hasApiKeys()` helper:
    - Create `backend/tests/utils/apiKeys.ts`
    - Export `hasApiKeys()` function
    - Update `mary-agent.test.ts` to import from utils
  - [ ] Create mock agent factories:
    - Create `backend/tests/utils/mockAgents.ts`
    - Implement mock LLMFactory
    - Implement mock DecisionEngine
    - Implement mock EscalationQueue
  - [ ] Create git setup utilities:
    - Create `backend/tests/utils/gitSetup.ts`
    - Implement test git configuration
    - Implement cleanup utilities
  - [ ] Create common test fixtures:
    - Create `backend/tests/utils/fixtures.ts`
    - Export common test data
    - Export sample LLM configs

- [ ] **Refactor Duplicate Test Code**
  - [ ] Identify all uses of `hasApiKeys` in test files
  - [ ] Update to use shared utility
  - [ ] Identify other duplicate patterns
  - [ ] Refactor to use shared utilities
  - [ ] Run tests to verify refactoring works

- [ ] **Update Documentation References**
  - [ ] Add testing guide to PR review checklist
  - [ ] Update `docs/definition-of-done.md` references
  - [ ] Update `README.md` testing section
  - [ ] Link from `docs/test-setup-guide.md` (if different)

#### Task 3: Restore Code Review Process (1-2 hours) - Action Item #3

- [ ] **Enable GitHub Branch Protection**
  - [ ] Navigate to repository Settings → Branches
  - [ ] Add branch protection rule for `main`:
    - Require pull request reviews before merging (checked)
    - Required approving reviews: 1
    - Dismiss stale pull request approvals (checked)
    - Require review from Code Owners (optional)
    - Require status checks to pass (checked)
    - Require branches to be up to date (optional)
  - [ ] Save branch protection rule
  - [ ] Verify direct commits to main are blocked

- [ ] **Update Definition of Done**
  - [ ] Open `docs/definition-of-done.md`
  - [ ] Add PR requirement to Section 4 (Code Review):
    - "Create PR and obtain approval" added to checklist
    - "PR review must be completed before merge" added
  - [ ] Update version history to v1.3
  - [ ] Commit changes

- [ ] **Document Team Commitment**
  - [ ] Create `docs/epic-3-process-commitments.md`
  - [ ] Document 100% PR review commitment for Epic 3
  - [ ] Document branch protection is now enforced
  - [ ] Document escalation process if review is blocked
  - [ ] Reference from retrospective

- [ ] **Update PR Template**
  - [ ] Check if `.github/pull_request_template.md` exists
  - [ ] If not, create PR template
  - [ ] Add code review checklist items:
    - OAuth authentication pattern (for agent stories)
    - Async pattern compliance
    - Test coverage requirements
    - Documentation completeness
  - [ ] Commit PR template

### Phase 2: High Priority Items (9-13 hours)

#### Task 4: Verify/Update Async Pattern Guidelines (4-6 hours) - Action Item #4

- [ ] **Review Existing Async Patterns Guide**
  - [ ] Read `docs/async-patterns-guide.md` thoroughly
  - [ ] Identify gaps in coverage
  - [ ] Identify Epic 1-2 examples missing from guide
  - [ ] Document needed improvements

- [ ] **Add Missing Examples**
  - [ ] Add `fs.accessSync` → `fs.access` example from Epic 1
  - [ ] Add promise handling patterns from Epic 2
  - [ ] Add error handling examples:
    - Try-catch in async functions
    - Promise rejection handling
    - Async error propagation
  - [ ] Add testing async code section:
    - Testing async functions with await
    - Testing promise rejection
    - Testing timeout scenarios

- [ ] **Create Code Review Checklist**
  - [ ] Create async patterns review checklist:
    - Are all async functions using async/await?
    - Are promises properly awaited?
    - Is error handling present for async operations?
    - Are timeouts configured appropriately?
    - Are tests using async/await correctly?
  - [ ] Add checklist to PR review template
  - [ ] Document in testing guide

- [ ] **Audit Epic 2 Codebase**
  - [ ] Review all Epic 2 code for async anti-patterns
  - [ ] Check DecisionEngine async usage
  - [ ] Check EscalationQueue async usage
  - [ ] Check Mary/John agent async usage
  - [ ] Check PRD workflow async usage
  - [ ] Document findings and fix if needed

#### Task 5: Review and Plan Epic 1 Deferred Work (2-3 hours) - Action Item #5

- [ ] **Review Story 1.10 Deferred Tasks**
  - [ ] Read Story 1.10 completion notes
  - [ ] List all deferred integration tasks:
    - LLM provider integration
    - Agent communication patterns
    - State manager integration
    - Real API integration tests
  - [ ] Document current status of each task

- [ ] **Assess Each Deferred Task**
  - [ ] **LLM Provider Integration**:
    - Status: Review current LLMFactory implementation
    - Decision: Address now / Defer to Epic 4 / Won't-do
    - If addressing: Create task in sprint-status.yaml
    - If deferring: Document in Epic 4 tech spec
    - If won't-do: Document rationale
  - [ ] **Agent Communication Patterns**:
    - Status: Review current agent collaboration (Mary/John)
    - Decision: Address now / Defer to Epic 4 / Won't-do
    - Document as above
  - [ ] **State Manager Integration**:
    - Status: Review WorkflowState usage
    - Decision: Address now / Defer to Epic 4 / Won't-do
    - Document as above
  - [ ] **Real API Integration Tests**:
    - Status: Review current integration test coverage
    - Decision: Address now / Defer to Epic 4 / Won't-do (may be addressed by Action Item #1)
    - Document as above

- [ ] **Update Sprint Status**
  - [ ] Open `docs/sprint-status.yaml`
  - [ ] Add decisions for each deferred task
  - [ ] Add new stories to backlog if needed
  - [ ] Commit changes

- [ ] **Document Resolution**
  - [ ] Create `docs/epic-1-deferred-work-resolution.md`
  - [ ] Document decision for each task
  - [ ] Document rationale for decisions
  - [ ] Reference from retrospectives
  - [ ] Commit documentation

#### Task 6: Document Integration Testing Strategy (3-4 hours) - Action Item #6

- [ ] **Create Integration Testing Strategy Document**
  - [ ] Create `docs/integration-testing-strategy.md`
  - [ ] Document strategy overview
  - [ ] Define integration test scope

- [ ] **Define Real vs Mocked Approach**
  - [ ] Document when to use real LLM providers:
    - Integration tests with API keys available
    - CI/CD with GitHub Secrets configured
    - Acceptance testing scenarios
  - [ ] Document when to use mocked providers:
    - Unit tests
    - Tests without API keys
    - Fast feedback loops
  - [ ] Document hybrid approach for different environments

- [ ] **Define API Key Dependency Strategy**
  - [ ] Document GitHub Secrets approach (from Action Item #1)
  - [ ] Document local development with .env files
  - [ ] Document test skip strategy for missing keys
  - [ ] Document API key rotation procedures

- [ ] **Define Coverage Targets**
  - [ ] Integration test coverage targets by component:
    - Agent personas: >80% integration coverage
    - Workflow executors: >80% integration coverage
    - Service integrations: >70% integration coverage
  - [ ] Document what "integration coverage" means
  - [ ] Document how to measure integration coverage

- [ ] **Create Integration Test Template**
  - [ ] Create template for agent persona integration tests
  - [ ] Include sections:
    - Multi-provider support
    - DecisionEngine integration
    - EscalationQueue integration
    - Performance requirements
    - Output quality checks
  - [ ] Document template usage
  - [ ] Add examples from Mary Agent tests

- [ ] **Plan CI/CD Integration**
  - [ ] Document CI/CD integration test execution plan
  - [ ] Document test parallelization strategy
  - [ ] Document test timeout policies
  - [ ] Document failure notification process

### Phase 3: Medium Priority Items (6-8 hours)

#### Task 7: Extract Shared Test Utilities (4-5 hours) - Action Item #7

**Note**: This is partially completed in Task 2. This task ensures completeness and documentation.

- [ ] **Verify Shared Utilities Directory**
  - [ ] Confirm `backend/tests/utils/` exists
  - [ ] Verify all utilities from Task 2 are implemented
  - [ ] Run tests to verify utilities work

- [ ] **Identify Additional Duplicates**
  - [ ] Search for duplicate test patterns across test files:
    - Duplicate mock factory code
    - Duplicate test data setup
    - Duplicate assertion patterns
    - Duplicate cleanup code
  - [ ] Document all duplicates found

- [ ] **Refactor Additional Duplicates**
  - [ ] For each duplicate pattern:
    - Extract to shared utility
    - Update all test files to use shared version
    - Verify tests still pass
  - [ ] Document refactoring in commit messages

- [ ] **Document Test Utilities**
  - [ ] Update `docs/testing-guide.md` with utilities section:
    - List all available utilities
    - Document usage examples
    - Document when to use each utility
    - Document how to add new utilities
  - [ ] Add JSDoc comments to utility functions
  - [ ] Add usage examples in utility files

- [ ] **Verify No Duplicate Utilities**
  - [ ] Run search for duplicate patterns
  - [ ] Verify no duplicates remain
  - [ ] Document verification results

#### Task 8: Implement Documentation Tracking Improvement (2-3 hours) - Action Item #8

- [ ] **Choose Implementation Approach**
  - [ ] Evaluate Option A: Process-based (2-3 hours)
  - [ ] Evaluate Option B: Tooling-based (8-10 hours)
  - [ ] Decide on approach based on effort/benefit
  - [ ] Document decision

- [ ] **Option A: Process-Based Improvement**
  - [ ] Update `docs/definition-of-done.md`:
    - Add "Perform end-of-story documentation review" to DoD
    - Add documentation review checklist
  - [ ] Update story template to include documentation review prompt
  - [ ] Create documentation review guide:
    - How to verify task checkboxes match completion
    - How to verify Dev Agent Record is complete
    - How to verify File List is accurate
  - [ ] Train team on new process

- [ ] **Option B: Tooling-Based Improvement** (if chosen)
  - [ ] Design task checkbox sync tool
  - [ ] Implement tool in scripts/
  - [ ] Add tool to git hooks (pre-commit)
  - [ ] Test tool with sample stories
  - [ ] Document tool usage
  - [ ] Add tool to CI/CD pipeline

- [ ] **Review Epic 2 Stories 2.7 and 2.8**
  - [ ] Read Story 2.7 documentation
  - [ ] Verify task checkboxes match implementation
  - [ ] Verify Dev Agent Record is complete
  - [ ] Verify File List is accurate
  - [ ] Fix any discrepancies found
  - [ ] Repeat for Story 2.8

- [ ] **Document Process for Epic 3**
  - [ ] Create `docs/documentation-tracking-process.md`
  - [ ] Document when to update documentation
  - [ ] Document how to verify documentation accuracy
  - [ ] Document review process
  - [ ] Reference from Definition of Done

## Dependencies

**Blocking Dependencies**:
- Must complete Tasks 1-3 (Critical items) before starting Epic 3 Story 3.1
- Task 6 (Integration Testing Strategy) should influence Epic 3 test design

**Internal Dependencies**:
- Task 2 partially completes Task 7 (shared test utilities)
- Task 1 informs Task 6 (CI/CD secrets inform integration testing strategy)
- Task 4 should reference Task 2 (testing guide should reference async guide)

**No Dependencies**:
- Task 5 (Epic 1 deferred work) is independent
- Task 8 (documentation tracking) is independent

## Recommended Execution Order

**Week 1 (Critical Path - Blocks Epic 3)**:
1. **Day 1-2**: Task 3 (1-2 hours) + Task 1 (4-6 hours) → Restore process + Enable CI/CD
2. **Day 3-4**: Task 2 (6-8 hours) → Document test configuration
3. **Day 5**: Verify Tasks 1-3 complete, all tests passing in CI/CD

**Week 2 (High Priority)**:
1. **Day 1**: Task 5 (2-3 hours) + Task 4 Part 1 (2 hours) → Review deferred work + Start async guide
2. **Day 2**: Task 4 Part 2 (2-4 hours) → Complete async guide
3. **Day 3**: Task 6 (3-4 hours) → Document integration testing strategy

**Week 3 (Medium Priority - Can Overlap with Epic 3)**:
1. **Day 1**: Task 7 (4-5 hours) → Extract remaining shared utilities
2. **Day 2**: Task 8 (2-3 hours) → Implement documentation tracking

**Total Effort**: 28-41 hours (3.5-5 days)

## Success Criteria

**Critical Success (Required for Epic 3)**:
- ✅ All 33 skipped tests now run in CI/CD and pass
- ✅ Branch protection prevents direct commits to main
- ✅ Testing guide eliminates repeat configuration issues

**High Priority Success**:
- ✅ Epic 1 deferred work has clear decisions (no uncertainty)
- ✅ Async patterns guide is comprehensive
- ✅ Integration testing strategy guides Epic 3

**Medium Priority Success**:
- ✅ No duplicate test utilities across test files
- ✅ Documentation tracking process prevents future mismatches

**Overall Success**:
- ✅ Epic 3 can start with confidence
- ✅ Technical debt from Epic 1 and Epic 2 is resolved
- ✅ Quality safeguards are restored
- ✅ Process discipline is enforced

## Risks and Mitigation

**Risk 1: API Key Security**
- **Threat**: GitHub Secrets exposure through logs
- **Mitigation**: Configure workflows to mask secrets in output
- **Mitigation**: Document security best practices
- **Mitigation**: Implement secret rotation procedures

**Risk 2: Integration Tests Fail in CI/CD**
- **Threat**: Tests pass locally but fail in CI/CD with real API calls
- **Mitigation**: Run integration tests locally before enabling in CI/CD
- **Mitigation**: Add retry logic for flaky API calls
- **Mitigation**: Document known intermittent failures

**Risk 3: Branch Protection Blocks Urgent Fixes**
- **Threat**: Emergency hotfixes blocked by review requirement
- **Mitigation**: Document emergency bypass procedure
- **Mitigation**: Configure admin override capability
- **Mitigation**: Add "hotfix" label to bypass restrictions

**Risk 4: Effort Estimation Too Low**
- **Threat**: Story takes longer than 3.5-5 days estimate
- **Mitigation**: Break into smaller sub-stories if needed
- **Mitigation**: Prioritize critical items first
- **Mitigation**: Accept that medium priority items may slip to Epic 3

## Notes

- This story addresses all 8 pending action items from Epic 2 retrospective
- Action Item #9 (OAuth authentication pattern) was completed immediately post-epic (commits f2012e6, 759283d, e466928, 5e8178d)
- This story is **required** before Epic 3 can start, per retrospective recommendation
- Total effort: 28-41 hours (3.5-5 days of full-time work)
- Can be worked by multiple developers in parallel to reduce calendar time

## References

- `docs/retrospective-epic-1.md` - Epic 1 action items
- `docs/retrospective-epic-2.md` - Epic 2 action items and blocking recommendation
- `docs/llm-provider-patterns.md` - OAuth pattern (Action Item #9 - Complete)
- `docs/definition-of-done.md` - Definition of Done v1.2
- `docs/async-patterns-guide.md` - Existing async patterns guide
- `docs/test-setup-guide.md` - Existing test setup guide

---

**Created**: 2025-11-10
**Epic**: Epic 2 (Post-completion technical debt resolution)
**Estimated Effort**: 28-41 hours
**Priority**: CRITICAL - Blocks Epic 3
**Dependencies**: None (first story before Epic 3)
**Status**: Drafted

# Story 5.8: Integration Tests

---
id: 5-8-integration-tests
title: Integration Tests
epic: epic-5
status: drafted
priority: high
estimate: 2
dependencies:
  - 5-1-core-agent-infrastructure
  - 5-2-story-context-generator
  - 5-3-workflow-orchestration-state-management
  - 5-4-code-implementation-pipeline
  - 5-5-test-generation-execution
  - 5-6-dual-agent-code-review
  - 5-7-pr-creation-automation
tags:
  - integration-testing
  - workflow-validation
  - quality-assurance
  - epic-5
---

## Story

As a **Story Implementation System**,
I want **comprehensive integration tests that validate the complete story development workflow and component interactions**,
so that **the autonomous implementation engine operates reliably with >80% code coverage and validated error recovery paths**.

## Acceptance Criteria

### AC1: Complete Workflow Execution Tested
- [ ] Integration test for end-to-end workflow: story file → context generation → implementation → tests → review → PR creation
- [ ] Test validates all workflow steps execute in correct sequence
- [ ] Test verifies state transitions at each major step (backlog → drafted → ready-for-dev → in-progress → review → done)
- [ ] Test confirms story artifacts created: code files, test files, PR description, sprint-status updates
- [ ] Test uses realistic mock data for story file, PRD, architecture, tech spec
- [ ] Test executes in <5 minutes (fast feedback loop)
- [ ] Test passes with no errors
- [ ] Test coverage: >80% of workflow orchestration code

### AC2: Agent Interaction Tests
- [ ] Integration test for Amelia agent initialization and method invocation
- [ ] Integration test for Alex agent initialization with different LLM configuration
- [ ] Test Amelia → Alex handoff: code implementation passed to independent reviewer
- [ ] Test context passing: StoryContext correctly provided to both agents
- [ ] Test review coordination: self-review + independent review → aggregated decision
- [ ] Test agent error handling: LLM API failures, timeout scenarios
- [ ] Test agent state tracking: idle → implementing → testing → reviewing → completed
- [ ] All agent interaction tests pass with proper mocking of LLM APIs

### AC3: Context Generation Pipeline Tested
- [ ] Integration test for StoryContextGenerator.generateContext()
- [ ] Test story file parsing: YAML frontmatter + markdown body
- [ ] Test PRD section extraction: relevant sections identified (<10k tokens)
- [ ] Test architecture section extraction: technical constraints identified (<15k tokens)
- [ ] Test onboarding docs loading: coding standards, patterns loaded (<10k tokens)
- [ ] Test existing code loading: files from story.technicalNotes.affectedFiles (<15k tokens)
- [ ] Test dependency context loading: prerequisite story context assembled
- [ ] Test token optimization: total context <50k tokens validated
- [ ] Test context caching: repeated calls use cached results
- [ ] Test validates all required sections present in Story Context XML

### AC4: PR Automation Tested with Mock GitHub API
- [ ] Integration test for PRCreationAutomator.createPR()
- [ ] Mock GitHub API responses using nock or msw
- [ ] Test PR creation: title, body, labels, reviewers correctly set
- [ ] Test CI monitoring: poll GitHub Checks API, wait for completion
- [ ] Test auto-merge: PR merged after CI passes (mocked)
- [ ] Test remote branch deletion after successful merge
- [ ] Test worktree cleanup invocation
- [ ] Test sprint-status.yaml update: "review" → "done"
- [ ] Test dependent story triggering after merge
- [ ] All PR automation tests pass with mocked GitHub API

### AC5: Error Recovery Scenarios Tested
- [ ] Integration test for failed test scenario: tests fail → Amelia fixes → re-run → pass
- [ ] Integration test for failed review scenario: Alex review fails → escalation triggered
- [ ] Integration test for CI failure scenario: checks fail → retry logic → escalation after max retries
- [ ] Integration test for transient error recovery: LLM API timeout → retry with exponential backoff
- [ ] Integration test for merge conflict scenario: PR merge fails → escalation with error details
- [ ] Integration test for context generation failure: missing PRD/architecture → clear error message
- [ ] Test error logging: all failures logged with correlation IDs and error details
- [ ] Test state preservation: workflow state persists after crash/failure
- [ ] Test resume capability: workflow resumes from last checkpoint after recovery
- [ ] All error recovery tests validate proper escalation and state management

### AC6: State Management Tested
- [ ] Integration test for worktree lifecycle: create → develop → cleanup
- [ ] Test worktree isolation: multiple parallel stories in separate worktrees
- [ ] Test agent state transitions: status updates tracked correctly
- [ ] Test sprint-status.yaml updates: atomic file updates, concurrent access handling
- [ ] Test state checkpointing: workflow state saved after each major step
- [ ] Test state recovery: load state from checkpoint and resume
- [ ] Test state consistency: no partial updates, rollback on failure
- [ ] Test concurrent story execution: 3 stories in parallel without conflicts
- [ ] All state management tests pass with proper isolation and consistency

### AC7: Escalation Triggers Tested
- [ ] Integration test for low confidence escalation: review confidence <0.85 → escalate
- [ ] Integration test for critical issues escalation: security vulnerabilities → escalate
- [ ] Integration test for persistent failures escalation: max retries exceeded → escalate
- [ ] Test escalation creates notification or issue (mocked)
- [ ] Test escalation includes comprehensive context: story details, error logs, recommendations
- [ ] Test escalation preserves worktree for human debugging
- [ ] Test escalation logs all relevant information with correlation IDs
- [ ] All escalation trigger tests validate proper escalation logic

### AC8: GitHub API Mocked for PR Operations
- [ ] GitHub API mocked using nock or msw library
- [ ] Mock responses for: pulls.create, issues.addLabels, pulls.requestReviewers, checks.listForRef, pulls.merge
- [ ] Mock realistic response data with proper TypeScript types
- [ ] Mock error scenarios: API failures, rate limits, network errors
- [ ] Mock CI check statuses: queued, in_progress, completed with various conclusions
- [ ] Mock validates request payloads (title, body, labels, reviewers)
- [ ] Mock implementation allows test customization (pass/fail scenarios)
- [ ] All tests use mocked GitHub API (no real API calls)

### AC9: >80% Code Coverage for Workflow Code
- [ ] Code coverage measured using Vitest coverage tools (@vitest/coverage-v8)
- [ ] Coverage includes all workflow components: orchestrator, context generator, PR automation
- [ ] Line coverage: >80% for new workflow code
- [ ] Branch coverage: >80% for decision paths
- [ ] Function coverage: >90% for public methods
- [ ] Coverage report generated and saved to coverage/
- [ ] Uncovered code identified and justified (dead code, defensive checks, etc.)
- [ ] Coverage metrics tracked over time for regression detection

### AC10: All Integration Tests Pass in <10 Minutes
- [ ] Complete integration test suite executes in <10 minutes
- [ ] Individual integration tests complete in <2 minutes each
- [ ] Test execution parallelized where possible
- [ ] Slow tests identified and optimized (mocking instead of real operations)
- [ ] Test timeouts configured appropriately (no infinite waits)
- [ ] Test results logged with execution time per test
- [ ] All tests pass consistently (no flaky tests)
- [ ] CI integration: tests run in GitHub Actions pipeline

## Tasks / Subtasks

- [ ] **Task 1: Create Integration Test Infrastructure** (AC: #8, #9, #10)
  - [ ] Create `test/integration/implementation/workflow/` directory
  - [ ] Install nock or msw for HTTP API mocking: `npm install -D nock @types/nock`
  - [ ] Create test fixtures: sample story files, PRD sections, architecture docs
  - [ ] Create GitHub API mock responses: PR creation, labels, reviewers, checks, merge
  - [ ] Configure Vitest for integration tests with longer timeouts
  - [ ] Set up code coverage collection: @vitest/coverage-v8
  - [ ] Create test utilities: mock builders, assertion helpers
  - [ ] Set up parallel test execution configuration

- [ ] **Task 2: Implement Complete Workflow Execution Test** (AC: #1)
  - [ ] Create `test/integration/implementation/workflow/complete-workflow.test.ts`
  - [ ] Create test fixture: realistic story file with all sections
  - [ ] Create mock PRD and architecture documents
  - [ ] Test Step 1: Load story file and validate parsing
  - [ ] Test Step 2: Generate story context with all required sections
  - [ ] Test Step 3: Create worktree for isolated development
  - [ ] Test Step 4: Amelia implements code (mocked LLM response)
  - [ ] Test Step 5: Amelia generates tests (mocked LLM response)
  - [ ] Test Step 6: Run tests and validate coverage
  - [ ] Test Step 7: Amelia self-review (mocked LLM response)
  - [ ] Test Step 8: Alex independent review (mocked LLM response)
  - [ ] Test Step 9: Create PR with mocked GitHub API
  - [ ] Test Step 10: Monitor CI and auto-merge (mocked)
  - [ ] Test Step 11: Cleanup worktree and update sprint-status
  - [ ] Assert: All workflow steps completed successfully
  - [ ] Assert: Story status updated to "done"
  - [ ] Assert: PR created with correct title, body, labels
  - [ ] Assert: Worktree cleaned up
  - [ ] Measure test execution time: <5 minutes

- [ ] **Task 3: Implement Agent Interaction Tests** (AC: #2)
  - [ ] Create `test/integration/implementation/workflow/agent-interactions.test.ts`
  - [ ] Test Amelia agent initialization with project config
  - [ ] Test Alex agent initialization with different LLM model
  - [ ] Mock LLM API responses for Amelia: implementStory(), writeTests(), reviewCode()
  - [ ] Mock LLM API responses for Alex: reviewSecurity(), analyzeQuality(), validateTests()
  - [ ] Test context passing: StoryContext provided to agents
  - [ ] Test Amelia → Alex handoff: code + tests passed to reviewer
  - [ ] Test review coordination: aggregated decision from both reviews
  - [ ] Test agent error handling: LLM API timeout → retry → success
  - [ ] Test agent state tracking: status transitions logged
  - [ ] Assert: Both agents invoked with correct context
  - [ ] Assert: Review reports aggregated correctly
  - [ ] Assert: Agent states tracked properly

- [ ] **Task 4: Implement Context Generation Pipeline Test** (AC: #3)
  - [ ] Create `test/integration/implementation/workflow/context-generation.test.ts`
  - [ ] Create test fixtures: story file, PRD, architecture, onboarding docs, existing code
  - [ ] Test story file parsing: YAML frontmatter + markdown body extracted
  - [ ] Test PRD section extraction: keywords identified, relevant sections loaded
  - [ ] Test architecture section extraction: technical notes matched to arch sections
  - [ ] Test onboarding docs loading: coding standards and patterns loaded
  - [ ] Test existing code loading: files from technicalNotes.affectedFiles loaded
  - [ ] Test dependency context: prerequisite story context assembled
  - [ ] Test token counting: total context <50k tokens
  - [ ] Test context caching: second call uses cached result
  - [ ] Test context XML generation: all required sections present
  - [ ] Assert: Context object has all expected fields
  - [ ] Assert: Token count within limit
  - [ ] Assert: XML format valid and parseable

- [ ] **Task 5: Implement PR Automation Test with Mock GitHub API** (AC: #4, #8)
  - [ ] Create `test/integration/implementation/workflow/pr-automation.test.ts`
  - [ ] Set up nock mocks for GitHub API endpoints
  - [ ] Mock octokit.pulls.create(): return PR number and URL
  - [ ] Mock octokit.issues.addLabels(): accept labels array
  - [ ] Mock octokit.pulls.requestReviewers(): accept reviewers list
  - [ ] Mock octokit.checks.listForRef(): return CI check statuses
  - [ ] Mock octokit.pulls.merge(): return merge SHA
  - [ ] Test PR creation: verify request payload (title, body, labels, reviewers)
  - [ ] Test CI monitoring: poll checks API, wait for completion
  - [ ] Test auto-merge: merge called after all checks pass
  - [ ] Test remote branch deletion: git push --delete called
  - [ ] Test worktree cleanup: WorktreeManager.removeWorktree() invoked
  - [ ] Test sprint-status update: "review" → "done"
  - [ ] Test dependent story triggering: ready stories identified
  - [ ] Assert: PR created with correct structure
  - [ ] Assert: All mocked API calls made with expected payloads

- [ ] **Task 6: Implement Error Recovery Scenario Tests** (AC: #5)
  - [ ] Create `test/integration/implementation/workflow/error-recovery.test.ts`
  - [ ] **Test Scenario 1: Failed Tests Recovery**
    - [ ] Mock test execution failure
    - [ ] Mock Amelia fix attempt
    - [ ] Mock test re-run success
    - [ ] Assert: Tests fixed and passing
  - [ ] **Test Scenario 2: Failed Review Escalation**
    - [ ] Mock Alex review failure (critical issues found)
    - [ ] Mock escalation trigger
    - [ ] Assert: Escalation notification created
    - [ ] Assert: Worktree preserved for debugging
  - [ ] **Test Scenario 3: CI Failure with Retry**
    - [ ] Mock CI checks failure
    - [ ] Mock retry logic (2 retries)
    - [ ] Mock final escalation after max retries
    - [ ] Assert: Retries attempted with delays
    - [ ] Assert: Escalation triggered with CI logs
  - [ ] **Test Scenario 4: Transient LLM API Error**
    - [ ] Mock LLM API timeout on first call
    - [ ] Mock retry with exponential backoff
    - [ ] Mock success on second call
    - [ ] Assert: Retry logic worked
    - [ ] Assert: Workflow continued after recovery
  - [ ] **Test Scenario 5: Merge Conflict Escalation**
    - [ ] Mock PR merge conflict error
    - [ ] Mock escalation with error details
    - [ ] Assert: Clear error message logged
    - [ ] Assert: Worktree preserved
  - [ ] **Test Scenario 6: Missing Context Documents**
    - [ ] Mock missing PRD file
    - [ ] Mock error handling
    - [ ] Assert: Clear error message about missing document
    - [ ] Assert: Workflow halted gracefully

- [ ] **Task 7: Implement State Management Tests** (AC: #6)
  - [ ] Create `test/integration/implementation/workflow/state-management.test.ts`
  - [ ] Test worktree creation: isolated directory created
  - [ ] Test worktree isolation: multiple worktrees for parallel stories
  - [ ] Test agent state transitions: idle → implementing → testing → reviewing → completed
  - [ ] Test sprint-status.yaml updates: atomic writes with temp file + rename
  - [ ] Test concurrent updates: multiple processes updating status file
  - [ ] Test state checkpointing: state saved after each major step
  - [ ] Test state recovery: workflow resumes from checkpoint
  - [ ] Test state rollback: restore previous state on failure
  - [ ] Test parallel execution: 3 stories simultaneously without conflicts
  - [ ] Assert: Worktrees isolated (no cross-contamination)
  - [ ] Assert: State transitions logged correctly
  - [ ] Assert: Sprint-status updates atomic (no corruption)
  - [ ] Assert: State recovery works after simulated crash

- [ ] **Task 8: Implement Escalation Trigger Tests** (AC: #7)
  - [ ] Create `test/integration/implementation/workflow/escalation-triggers.test.ts`
  - [ ] **Test Low Confidence Escalation**
    - [ ] Mock review confidence <0.85
    - [ ] Mock escalation trigger
    - [ ] Assert: Escalation notification created
    - [ ] Assert: Worktree preserved
  - [ ] **Test Critical Issues Escalation**
    - [ ] Mock security vulnerabilities in Alex review
    - [ ] Mock escalation with vulnerability details
    - [ ] Assert: Clear vulnerability report in escalation
  - [ ] **Test Persistent Failures Escalation**
    - [ ] Mock max retries exceeded (test failures)
    - [ ] Mock escalation after 3 failed attempts
    - [ ] Assert: Escalation includes all retry logs
  - [ ] Test escalation context: story details, error logs, recommendations included
  - [ ] Test escalation preserves worktree for debugging
  - [ ] Test escalation logs correlation IDs for tracing
  - [ ] Assert: All escalation triggers work correctly

- [ ] **Task 9: Measure and Report Code Coverage** (AC: #9)
  - [ ] Configure Vitest coverage: lines, branches, functions, statements
  - [ ] Run integration tests with coverage: `vitest run --coverage`
  - [ ] Generate coverage report: HTML and JSON formats
  - [ ] Analyze coverage results: identify uncovered code
  - [ ] Add tests for uncovered code paths if needed
  - [ ] Validate line coverage: >80% for workflow code
  - [ ] Validate branch coverage: >80% for decision paths
  - [ ] Validate function coverage: >90% for public methods
  - [ ] Document coverage exclusions: defensive code, error handling edge cases
  - [ ] Save coverage report to `coverage/` directory
  - [ ] Assert: Coverage targets met

- [ ] **Task 10: Optimize Test Execution Performance** (AC: #10)
  - [ ] Measure current test suite execution time
  - [ ] Identify slow tests (>2 minutes)
  - [ ] Optimize slow tests: reduce mock delays, parallelize where possible
  - [ ] Configure test parallelization in Vitest config
  - [ ] Set appropriate test timeouts (no infinite waits)
  - [ ] Mock instead of real operations: file system, git, LLM APIs
  - [ ] Run full integration test suite and measure time
  - [ ] Validate: All tests pass in <10 minutes
  - [ ] Configure CI pipeline: run integration tests on PR
  - [ ] Log test execution times for monitoring
  - [ ] Assert: Test suite completes in <10 minutes
  - [ ] Assert: No flaky tests (100% pass rate over 10 runs)

## Dev Notes

### Architecture Alignment

**From Epic 5 Tech Spec - Integration Tests:**
- Story 5.8 validates the complete autonomous implementation engine built in Stories 5.1-5.7
- Integration tests ensure workflow components interact correctly and handle errors gracefully
- Tests cover: workflow execution, agent interactions, context generation, PR automation, error recovery, state management, escalation triggers
- Target: >80% code coverage for all workflow code
- Performance requirement: All integration tests pass in <10 minutes

**Integration with Epic 1 Core:**
- Tests validate integration with WorkflowEngine, AgentPool, StateManager, WorktreeManager from Epic 1
- Tests verify workflow plugin pattern works correctly for story development workflows
- Tests confirm event emission for monitoring: story.started, code.implemented, review.completed, pr.created, story.completed

**Integration with Stories 5.1-5.7:**
- Tests validate Amelia and Alex agent infrastructure (Story 5.1)
- Tests verify StoryContextGenerator produces valid context <50k tokens (Story 5.2)
- Tests confirm WorkflowOrchestrator executes complete pipeline (Story 5.3)
- Tests validate CodeImplementationPipeline follows architecture (Story 5.4)
- Tests verify TestGenerationExecutor achieves >80% coverage (Story 5.5)
- Tests confirm DualAgentCodeReviewer coordinates both agents (Story 5.6)
- Tests validate PRCreationAutomator creates PRs and auto-merges (Story 5.7)

**Data Flow Validation:**
```
Story File (docs/stories/story-*.md)
  ↓
StoryContextGenerator → Story Context XML (<50k tokens)
  ↓
WorkflowOrchestrator.executeStoryWorkflow()
  ↓
Create Worktree (isolated development)
  ↓
Amelia.implementStory(context) → CodeImplementation
  ↓
Amelia.writeTests(implementation) → TestSuite
  ↓
Run Tests → TestResults + CoverageReport
  ↓
Amelia.reviewCode(implementation) → SelfReviewReport
  ↓
Alex.generateReport([security, quality, testValidation]) → IndependentReviewReport
  ↓
Decision Logic (confidence >0.85 + no critical issues = proceed)
  ↓
PRCreationAutomator.createPR(worktree, storyId, reviewReport)
  ↓
Monitor CI → Auto-Merge → Cleanup → Update sprint-status
  ↓
Story Status: done
```

**File Structure:**
```
test/integration/implementation/workflow/
  ├── complete-workflow.test.ts         # End-to-end workflow validation
  ├── agent-interactions.test.ts        # Amelia ↔ Alex coordination
  ├── context-generation.test.ts        # Context assembly and optimization
  ├── pr-automation.test.ts             # PR creation and merge pipeline
  ├── error-recovery.test.ts            # Error handling and retry logic
  ├── state-management.test.ts          # Worktree lifecycle and state transitions
  ├── escalation-triggers.test.ts       # Escalation logic validation
  └── fixtures/                         # Test data: story files, PRD, architecture
      ├── sample-story.md
      ├── sample-prd.md
      ├── sample-architecture.md
      ├── sample-onboarding-docs.md
      └── github-api-mocks.ts           # Mock GitHub API responses
```

### Key Design Decisions

1. **Mock GitHub API**: Use nock or msw to mock all GitHub API calls (no real API requests in tests)
2. **Mock LLM APIs**: Use fixture responses for Amelia and Alex to avoid LLM costs and ensure deterministic tests
3. **Real File System Operations**: Use real git and file system operations in isolated test directories for realistic integration testing
4. **Test Isolation**: Each test creates isolated worktrees and temporary directories, cleaned up after test completion
5. **Performance Optimization**: Parallelize tests where possible, use mocks instead of real operations, set appropriate timeouts
6. **Coverage Target**: >80% line coverage, >80% branch coverage, >90% function coverage for workflow code
7. **Error Scenario Testing**: Comprehensive error recovery tests for all failure modes (tests fail, review fails, CI fails, LLM timeouts, merge conflicts)

### Testing Standards

**Integration Test Requirements:**
- Mock external APIs: GitHub API (nock/msw), LLM APIs (fixture responses)
- Real operations where feasible: file system, git (in isolated test directories)
- AAA pattern: Arrange (setup), Act (execute), Assert (validate)
- Test isolation: each test independent, no shared state
- Performance: individual tests <2 minutes, full suite <10 minutes
- Coverage: >80% for workflow code
- No flaky tests: 100% pass rate over multiple runs

**Test Frameworks:**
- Vitest for unit and integration tests
- @vitest/coverage-v8 for code coverage
- nock or msw for HTTP API mocking
- Real git operations in temporary directories

**Test Data:**
- Realistic story files with all sections (YAML frontmatter + markdown)
- Sample PRD and architecture documents with relevant content
- Mock LLM responses for deterministic testing
- Known-good and known-bad code samples for review testing

### Project Structure Notes

**Test Directory Structure:**
- Integration tests at `test/integration/implementation/workflow/`
- Test fixtures at `test/integration/implementation/workflow/fixtures/`
- Follows patterns from Stories 5.1-5.7 tests
- No conflicts with existing test structure

**Dependencies:**
- Story 5.1: Amelia and Alex agent infrastructure to test
- Story 5.2: StoryContextGenerator to validate
- Story 5.3: WorkflowOrchestrator to execute
- Story 5.4: CodeImplementationPipeline to test
- Story 5.5: TestGenerationExecutor to validate
- Story 5.6: DualAgentCodeReviewer to test
- Story 5.7: PRCreationAutomator to validate
- nock or msw for HTTP mocking
- Vitest and @vitest/coverage-v8 for testing and coverage

### References

- [Source: docs/epics/epic-5-tech-spec.md#Integration-Tests] - Story 5.8 acceptance criteria (lines 963-973)
- [Source: docs/epics/epic-5-tech-spec.md#Test-Strategy-Summary] - Integration testing approach (lines 1111-1119)
- [Source: docs/epics/epic-5-tech-spec.md#Workflows-and-Sequencing] - Story 5.3 Internal Sequence to validate (lines 632-676)
- [Source: docs/epics/epic-5-tech-spec.md#Data-Models-and-Contracts] - Type definitions to validate (lines 86-309)
- [Source: docs/stories/5-1-core-agent-infrastructure.md] - Agent infrastructure to test
- [Source: docs/stories/5-2-story-context-generator.md] - Context generation to validate
- [Source: docs/stories/5-3-workflow-orchestration-state-management.md] - Orchestrator to execute
- [Source: docs/stories/5-4-code-implementation-pipeline.md] - Implementation pipeline to test
- [Source: docs/stories/5-5-test-generation-execution.md] - Test generation to validate
- [Source: docs/stories/5-6-dual-agent-code-review.md] - Dual-agent review to test
- [Source: docs/stories/5-7-pr-creation-automation.md] - PR automation to validate

### Learnings from Previous Story

**From Story 5-7-pr-creation-automation (Status: done)**

Story 5.7 successfully implemented complete PR creation automation with exceptional quality (277/280 tests passing, 98.9%). Key insights for Story 5.8:

- **Testing Patterns Established**:
  - AAA pattern used consistently throughout all tests
  - Comprehensive mocking of external dependencies (@octokit/rest, WorktreeManager, file system)
  - 10/10 unit tests passing for PRCreationAutomator
  - 5/8 integration tests passing (3 have mocking setup issues, not implementation bugs)
  - Real integration tests with realistic scenarios, edge cases covered

- **Integration Test Challenges Identified**:
  - Mock setup complexity: 3 integration tests failed due to spy/mock configuration issues
  - Timeout issues: CI failure retry test times out (needs shorter polling interval for tests)
  - HTTP mocking: Manual spy setup less reliable than nock/msw
  - Recommendation: Use nock or msw for more reliable GitHub API mocking in Story 5.8

- **Test Infrastructure for Story 5.8**:
  - Install nock or msw for HTTP API mocking: `npm install -D nock @types/nock`
  - Create test fixtures: sample story files, PRD, architecture, onboarding docs
  - Create GitHub API mock responses: PR creation, labels, reviewers, checks, merge
  - Use shorter timeouts and polling intervals in tests (avoid test timeouts)
  - Parallelize tests where possible for <10 minute execution time

- **Components to Test in Story 5.8**:
  - WorkflowOrchestrator.executeStoryWorkflow() - Complete pipeline execution
  - StoryContextGenerator.generateContext() - Context assembly and token optimization
  - Amelia agent methods: implementStory(), writeTests(), reviewCode()
  - Alex agent methods: reviewSecurity(), analyzeQuality(), validateTests(), generateReport()
  - DualAgentCodeReviewer.performDualReview() - Review coordination
  - PRCreationAutomator.createPR() - PR creation and merge pipeline
  - Error recovery: test failures, review failures, CI failures, LLM timeouts
  - State management: worktree lifecycle, sprint-status updates, checkpointing

- **Mock Strategy for Story 5.8**:
  - GitHub API: Use nock to mock octokit.pulls.create, issues.addLabels, checks.listForRef, pulls.merge
  - LLM APIs: Use fixture responses for Amelia and Alex (deterministic, no API costs)
  - File System: Use real operations in temporary test directories (realistic integration)
  - Git Operations: Use real git in isolated test repositories (validate actual worktree management)
  - WorktreeManager: Real implementation (validates actual git worktree operations)

- **Performance Optimization for Story 5.8**:
  - Target: <10 minutes for complete integration test suite
  - Individual tests: <2 minutes each
  - Use mocks instead of real operations where feasible (LLM APIs, GitHub API)
  - Parallelize tests: configure Vitest to run tests in parallel
  - Reduce mock delays: use shorter polling intervals for CI monitoring tests
  - Skip slow operations: don't actually run npm test in integration tests (mock test results)

- **Coverage Target for Story 5.8**:
  - >80% line coverage for workflow orchestration code
  - >80% branch coverage for decision paths (review decisions, error handling)
  - >90% function coverage for public methods
  - Use @vitest/coverage-v8 for coverage collection
  - Generate HTML and JSON coverage reports
  - Identify and justify uncovered code (defensive checks, dead code)

- **Error Recovery Scenarios for Story 5.8**:
  - Failed tests: mock test failure → Amelia fixes → re-run → success
  - Failed review: Alex critical issues → escalation triggered
  - CI failure: checks fail → retry (2 attempts) → escalation after max retries
  - Transient LLM error: timeout → exponential backoff → success on retry
  - Merge conflict: PR merge fails → escalation with error details
  - Missing documents: PRD not found → clear error message, graceful halt

- **Escalation Testing for Story 5.8**:
  - Low confidence (<0.85) → escalation with review details
  - Critical security issues → escalation with vulnerability report
  - Persistent failures (max retries) → escalation with all retry logs
  - Validate escalation context: story details, error logs, recommendations
  - Validate worktree preservation for human debugging
  - Validate correlation IDs for log tracing

- **State Management Testing for Story 5.8**:
  - Worktree isolation: 3 parallel stories in separate worktrees
  - Atomic updates: sprint-status.yaml temp file + rename pattern
  - State transitions: idle → implementing → testing → reviewing → completed
  - Checkpointing: state saved after each major step
  - Recovery: workflow resumes from checkpoint after simulated crash
  - Consistency: no partial updates, rollback on failure

[Source: docs/stories/5-7-pr-creation-automation.md#Dev-Agent-Record]
[Source: docs/stories/5-7-pr-creation-automation.md#Senior-Developer-Review]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

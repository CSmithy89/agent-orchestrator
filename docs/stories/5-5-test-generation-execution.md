# Story 5.5: Test Generation Execution

---
id: 5-5-test-generation-execution
title: Test Generation Execution
epic: epic-5
status: drafted
priority: high
estimate: 2
dependencies:
  - 5-1-core-agent-infrastructure
  - 5-2-story-context-generator
  - 5-3-workflow-orchestration-state-management
  - 5-4-code-implementation-pipeline
tags:
  - testing
  - test-generation
  - code-coverage
  - amelia-agent
  - epic-5
---

## Story

As a **Story Implementation System**,
I want **a TestGenerationExecutor that generates comprehensive tests and executes them with >80% code coverage**,
so that **stories are autonomously implemented with high-quality tests, proper coverage validation, and automatic failure recovery**.

## Acceptance Criteria

### AC1: TestGenerationExecutor Class Implemented
- [ ] TestGenerationExecutor class created with `execute(implementation: CodeImplementation, context: StoryContext): Promise<TestSuite>` method
- [ ] Class implements Epic 5 type definitions per tech spec (TestSuite, CoverageReport, TestResults interfaces)
- [ ] Constructor accepts dependencies: Amelia agent, file system utilities, test runner utilities
- [ ] Method orchestrates complete test generation and execution pipeline
- [ ] Proper error handling for each testing step with clear error messages
- [ ] Logging at INFO level for each major testing phase
- [ ] Exports class for use in WorkflowOrchestrator (Story 5.3)

### AC2: Unit Tests Generated for All New Functions/Classes
- [ ] Test generator analyzes implemented code to identify functions and classes
- [ ] Unit test created for each public function and class method
- [ ] Test template applied based on function signature and purpose
- [ ] Mock data and fixtures generated for function inputs
- [ ] Assertions generated based on expected behavior from story context
- [ ] Test naming convention followed: `describe()` for classes/modules, `it()` or `test()` for individual tests
- [ ] AAA pattern (Arrange-Act-Assert) applied to all generated tests
- [ ] Edge cases included: null/undefined inputs, empty arrays, boundary conditions

### AC3: Integration Tests Written for API Endpoints or Workflows
- [ ] Integration tests generated for API endpoints (if story involves REST/GraphQL)
- [ ] Integration tests generated for workflow orchestration (if story involves multi-step processes)
- [ ] Database integration tests included (if story involves data persistence)
- [ ] External API integration tests included with mocking (if story involves third-party APIs)
- [ ] End-to-end test scenarios created for complete user flows
- [ ] Integration test setup and teardown functions generated
- [ ] Test isolation ensured (no test interdependencies)
- [ ] Integration tests use realistic test data and scenarios

### AC4: Edge Case and Error Condition Tests Included
- [ ] Error handling tests generated for each try-catch block
- [ ] Boundary condition tests included: min/max values, empty inputs, null/undefined
- [ ] Validation failure tests generated for input validation logic
- [ ] Concurrency tests included (if story involves async operations or race conditions)
- [ ] Timeout tests generated for async operations
- [ ] Error propagation tests verify errors thrown/returned correctly
- [ ] Edge case identification from story acceptance criteria and technical notes
- [ ] Security edge cases tested: SQL injection attempts, XSS payloads, path traversal

### AC5: Project's Test Framework Used (Auto-Detected)
- [ ] Test framework auto-detected from package.json or existing test files (Vitest, Jest, Mocha, etc.)
- [ ] Generated tests use detected framework's syntax and APIs
- [ ] Test configuration loaded from project config (vitest.config.ts, jest.config.js, etc.)
- [ ] Coverage tool detected (Vitest coverage, Istanbul/c8, etc.)
- [ ] Test runner command determined from package.json scripts (npm test, npm run test:unit, etc.)
- [ ] Framework-specific features used: Vitest snapshots, Jest mocks, Mocha hooks
- [ ] Error if no test framework detected with recommendation to configure

### AC6: Test Files Created at test/**/*.test.ts
- [ ] Test files created following project's test directory structure
- [ ] Unit tests placed at: `test/unit/{module-path}/{file-name}.test.ts`
- [ ] Integration tests placed at: `test/integration/{module-path}/{file-name}.test.ts`
- [ ] Test file naming convention: `{source-file-name}.test.ts` or `{source-file-name}.spec.ts`
- [ ] Directory structure mirrors source code structure
- [ ] Test files created with proper imports for source code and test framework
- [ ] TypeScript configuration applied to test files (if project uses TypeScript)
- [ ] File permissions set correctly (readable/writable)

### AC7: Tests Executed in Worktree (npm test)
- [ ] Test execution runs in isolated worktree (not main branch)
- [ ] Test runner command executed: npm test or project-specific command
- [ ] Test execution output captured (stdout and stderr)
- [ ] Test results parsed to extract: passed count, failed count, skipped count
- [ ] Test duration tracked for performance monitoring
- [ ] Test execution timeout enforced (30 minutes max)
- [ ] Test execution environment variables set (NODE_ENV=test, etc.)
- [ ] Test execution errors captured and logged

### AC8: Code Coverage Report Generated with >80% Target
- [ ] Code coverage report generated using detected coverage tool
- [ ] Coverage metrics extracted: lines, functions, branches, statements
- [ ] Coverage percentage calculated for new code only (not entire codebase)
- [ ] Coverage target validation: >80% for lines, functions, branches, statements
- [ ] Uncovered lines identified and reported (file:line references)
- [ ] Coverage report saved to worktree (coverage/index.html or similar)
- [ ] Coverage summary logged at INFO level
- [ ] Warning logged if coverage <80% with uncovered line details

### AC9: Failing Tests Automatically Fixed (Up to 3 Attempts)
- [ ] Test failures detected and parsed from test runner output
- [ ] Failure details extracted: test name, error message, stack trace
- [ ] Amelia agent invoked to fix failing tests with failure context
- [ ] Fixed test code applied to worktree
- [ ] Tests re-executed after fixes applied
- [ ] Retry loop: up to 3 attempts to fix and re-run tests
- [ ] Escalation if tests still fail after 3 attempts
- [ ] Fix attempt tracking logged: attempt number, failure count, duration

### AC10: Test Suite Committed with Implementation
- [ ] Test files staged in git after successful test execution
- [ ] Git commit created with descriptive message: "Tests for Story {{story-id}}: {{description}}"
- [ ] Commit message body includes: test count, coverage summary, frameworks used
- [ ] All test files included in commit
- [ ] Coverage report files excluded from commit (typically in .gitignore)
- [ ] Commit created in worktree (isolated from main branch)
- [ ] Commit SHA captured for traceability
- [ ] No partial or broken commits (tests must pass before commit)

### AC11: Tests Complete in <30 Minutes
- [ ] Complete test generation and execution measured: generate → execute → fix → commit
- [ ] Target: <30 minutes for typical story (moderate complexity, 10-20 tests)
- [ ] Performance logging: Duration logged for each major step
- [ ] Bottleneck identification: Steps >10 minutes logged as warnings
- [ ] Performance metrics tracked: test generation, test execution, coverage analysis, fix attempts
- [ ] Optimization opportunities logged for future improvements
- [ ] Timeout enforced: Escalate if total time exceeds 30 minutes

### AC12: Integration with Story 5.3 Orchestrator
- [ ] TestGenerationExecutor invoked by WorkflowOrchestrator.executeAmeliaTesting()
- [ ] Input: CodeImplementation from Story 5.4 + StoryContext from Story 5.2
- [ ] Output: TestSuite object with test files, results, coverage report
- [ ] Error handling integrates with WorkflowOrchestrator retry logic
- [ ] State updates communicated back to orchestrator
- [ ] No direct dependencies on WorkflowOrchestrator (loose coupling)

### AC13: Unit Tests for TestGenerationExecutor
- [ ] Unit tests created for TestGenerationExecutor class
- [ ] Test test generation with mock Amelia agent and mock code implementation
- [ ] Test error handling for each step (test generation failures, execution failures, coverage failures)
- [ ] Test coverage report parsing and validation
- [ ] Test automatic fix retry logic (1-3 attempts)
- [ ] Test framework auto-detection with various project configurations
- [ ] Test file creation at correct paths
- [ ] All tests pass with >80% code coverage for test generation module

### AC14: Integration Tests
- [ ] Integration tests created for complete test generation and execution pipeline
- [ ] Mock code implementation with realistic source code
- [ ] Test happy path: generate → execute → validate coverage → commit
- [ ] Test error scenarios: test failures, low coverage, framework not detected
- [ ] Test integration with real test framework (Vitest in test project)
- [ ] Test integration with real file system (test directory)
- [ ] Test auto-fix retry logic with real test failures
- [ ] All integration tests pass in <5 minutes

## Tasks / Subtasks

- [ ] **Task 1: Create TestGenerationExecutor Class** (AC: #1, #12)
  - [ ] Create `src/implementation/testing/TestGenerationExecutor.ts`
  - [ ] Implement constructor with dependency injection (Amelia agent, FileSystemUtils, TestRunnerUtils)
  - [ ] Implement `execute(implementation: CodeImplementation, context: StoryContext): Promise<TestSuite>` method
  - [ ] Add logging infrastructure for each testing phase
  - [ ] Add error handling with clear error messages
  - [ ] Export class for use in WorkflowOrchestrator

- [ ] **Task 2: Implement Test Framework Auto-Detection** (AC: #5)
  - [ ] Create `detectTestFramework()` private method
  - [ ] Check package.json for test framework dependencies (vitest, jest, mocha, etc.)
  - [ ] Check for existing test files to infer framework from syntax
  - [ ] Load test configuration from project config files
  - [ ] Determine test runner command from package.json scripts
  - [ ] Detect coverage tool from dependencies or config
  - [ ] Handle error if no framework detected with helpful message
  - [ ] Log detected framework and configuration

- [ ] **Task 3: Implement Unit Test Generation** (AC: #2)
  - [ ] Create `generateUnitTests()` private method
  - [ ] Analyze implemented code to identify functions, classes, methods
  - [ ] Invoke Amelia.writeTests(implementation) from Story 5.1
  - [ ] Receive test code response from Amelia
  - [ ] Apply test templates based on detected framework
  - [ ] Generate mock data and fixtures for test inputs
  - [ ] Apply AAA pattern (Arrange-Act-Assert) to generated tests
  - [ ] Include edge cases: null/undefined, empty arrays, boundary conditions
  - [ ] Validate test code syntax and structure
  - [ ] Log test generation results: test count, test types

- [ ] **Task 4: Implement Integration Test Generation** (AC: #3)
  - [ ] Create `generateIntegrationTests()` private method
  - [ ] Identify integration points from story context (APIs, workflows, database, external services)
  - [ ] Generate API endpoint tests (if applicable)
  - [ ] Generate workflow orchestration tests (if applicable)
  - [ ] Generate database integration tests with setup/teardown (if applicable)
  - [ ] Generate external API mock tests (if applicable)
  - [ ] Create test isolation logic (no interdependencies)
  - [ ] Generate realistic test data and scenarios
  - [ ] Log integration test generation results

- [ ] **Task 5: Implement Edge Case and Error Condition Test Generation** (AC: #4)
  - [ ] Create `generateEdgeCaseTests()` private method
  - [ ] Analyze code for try-catch blocks and generate error handling tests
  - [ ] Generate boundary condition tests (min/max values, empty inputs)
  - [ ] Generate validation failure tests for input validation logic
  - [ ] Generate concurrency tests for async operations (if applicable)
  - [ ] Generate timeout tests for async operations
  - [ ] Generate error propagation tests
  - [ ] Extract edge cases from story acceptance criteria
  - [ ] Include security edge case tests (SQL injection, XSS, path traversal)
  - [ ] Log edge case test generation results

- [ ] **Task 6: Implement Test File Creation** (AC: #6)
  - [ ] Create `createTestFiles()` private method
  - [ ] Determine test file paths following project structure
  - [ ] Create unit test files at `test/unit/{module-path}/{file-name}.test.ts`
  - [ ] Create integration test files at `test/integration/{module-path}/{file-name}.test.ts`
  - [ ] Mirror source code directory structure in test directory
  - [ ] Create directories recursively as needed
  - [ ] Write test files with proper imports and framework syntax
  - [ ] Apply TypeScript configuration to test files
  - [ ] Validate file creation success
  - [ ] Log test file creation results: file count, paths

- [ ] **Task 7: Implement Test Execution** (AC: #7)
  - [ ] Create `executeTests()` private method
  - [ ] Execute test runner command in worktree (npm test or detected command)
  - [ ] Set environment variables for test execution (NODE_ENV=test)
  - [ ] Capture test execution output (stdout and stderr)
  - [ ] Parse test results: passed, failed, skipped counts
  - [ ] Track test execution duration
  - [ ] Enforce 30-minute timeout
  - [ ] Handle test execution errors
  - [ ] Log test execution results

- [ ] **Task 8: Implement Coverage Report Generation** (AC: #8)
  - [ ] Create `generateCoverageReport()` private method
  - [ ] Execute coverage tool (npm run test:coverage or detected command)
  - [ ] Parse coverage report output (JSON, LCOV, or HTML)
  - [ ] Extract coverage metrics: lines, functions, branches, statements
  - [ ] Calculate coverage percentage for new code only
  - [ ] Validate coverage >80% target
  - [ ] Identify uncovered lines (file:line references)
  - [ ] Save coverage report to worktree
  - [ ] Log coverage summary and warnings if <80%

- [ ] **Task 9: Implement Automatic Test Fixing** (AC: #9)
  - [ ] Create `fixFailingTests()` private method
  - [ ] Parse test failure details from test runner output
  - [ ] Extract: test name, error message, stack trace
  - [ ] Invoke Amelia agent to fix failing tests with failure context
  - [ ] Apply fixed test code to worktree
  - [ ] Re-execute tests after fixes
  - [ ] Implement retry loop: up to 3 attempts
  - [ ] Escalate if tests still fail after 3 attempts
  - [ ] Log fix attempt tracking: attempt number, failure count, duration

- [ ] **Task 10: Implement Test Suite Commit** (AC: #10)
  - [ ] Create `commitTestSuite()` private method
  - [ ] Stage all test files in git
  - [ ] Generate commit message: "Tests for Story {{story-id}}: {{description}}"
  - [ ] Add commit body: test count, coverage summary, frameworks used
  - [ ] Create commit in worktree
  - [ ] Capture commit SHA for traceability
  - [ ] Exclude coverage report files from commit
  - [ ] Handle git errors gracefully
  - [ ] Validate tests pass before commit

- [ ] **Task 11: Implement Performance Tracking** (AC: #11)
  - [ ] Track test generation and execution time: generate → execute → fix → commit
  - [ ] Log duration for each major step
  - [ ] Identify bottlenecks: Log warnings for steps >10 minutes
  - [ ] Store performance metrics in TestSuite result
  - [ ] Log final pipeline duration
  - [ ] Target: <30 minutes for typical story
  - [ ] Enforce 30-minute timeout with escalation

- [ ] **Task 12: Implement WorkflowOrchestrator Integration** (AC: #12)
  - [ ] Design interface for orchestrator invocation
  - [ ] Accept CodeImplementation and StoryContext as inputs
  - [ ] Return TestSuite object to orchestrator
  - [ ] Handle errors compatible with orchestrator retry logic
  - [ ] Ensure loose coupling (no direct orchestrator dependencies)
  - [ ] Document integration points

- [ ] **Task 13: Write Unit Tests** (AC: #13)
  - [ ] Create `test/unit/implementation/testing/TestGenerationExecutor.test.ts`
  - [ ] Test framework auto-detection with various configurations
  - [ ] Test unit test generation with mock Amelia responses
  - [ ] Test integration test generation with mock code
  - [ ] Test edge case test generation
  - [ ] Test file creation with mock file system
  - [ ] Test execution with mock test runner
  - [ ] Test coverage report parsing and validation
  - [ ] Test automatic fix retry logic
  - [ ] Test error handling for each step
  - [ ] Run all tests and verify >80% coverage

- [ ] **Task 14: Write Integration Tests** (AC: #14)
  - [ ] Create `test/integration/implementation/testing/test-generation.test.ts`
  - [ ] Create mock code implementation with realistic source code
  - [ ] Test happy path: generate → execute → validate coverage → commit
  - [ ] Test with real test framework (Vitest in test project)
  - [ ] Test with real file system (test directory)
  - [ ] Test error scenarios: test failures, low coverage, framework not detected
  - [ ] Test auto-fix retry logic with real test failures
  - [ ] Run all integration tests and verify pass rate

## Dev Notes

### Architecture Alignment

**From Epic 5 Tech Spec - Test Generation & Execution:**
- This story implements the test generation and execution component invoked by Story 5.3 WorkflowOrchestrator
- TestGenerationExecutor executes Amelia agent to generate tests and validate coverage
- Complete pipeline: code → generate tests → execute → validate coverage → fix failures → commit
- Integration point: WorkflowOrchestrator.executeAmeliaTesting() calls TestGenerationExecutor.execute()

**Integration with Epic 1 Core:**
- Uses FileSystemUtils from Epic 1 for file operations
- Uses GitClient from Epic 1 for git commits
- Follows workflow plugin pattern from Epic 1

**Integration with Story 5.1 (Core Agent Infrastructure):**
- Invokes Amelia agent methods: writeTests(implementation)
- Receives test code response with test files and metadata
- Different from Story 5.3 (which orchestrates Amelia) - this story implements the test pipeline Amelia uses

**Integration with Story 5.2 (Story Context Generator):**
- Receives StoryContext for test generation guidance
- Uses context to identify integration points and edge cases
- Context includes: PRD, architecture, onboarding, existing code

**Integration with Story 5.3 (Workflow Orchestration):**
- Invoked by WorkflowOrchestrator at Step 4 (testing phase)
- Receives CodeImplementation from Story 5.4
- Returns TestSuite to orchestrator
- Error handling integrates with orchestrator retry logic

**Integration with Story 5.4 (Code Implementation Pipeline):**
- Receives CodeImplementation as input
- Generates tests for all files in implementation
- Validates implementation through test execution

**Data Flow:**
```
CodeImplementation (from Story 5.4) + StoryContext (from Story 5.2)
  ↓
TestGenerationExecutor.execute(implementation, context)
  ↓
Step 1: detectTestFramework() → Framework config
  ↓
Step 2: generateUnitTests() → Unit test files
  ↓
Step 3: generateIntegrationTests() → Integration test files
  ↓
Step 4: generateEdgeCaseTests() → Edge case test files
  ↓
Step 5: createTestFiles() → Write tests to worktree
  ↓
Step 6: executeTests() → Run tests, capture results
  ↓
Step 7: generateCoverageReport() → Coverage metrics
  ↓
Step 8: validateCoverage() → Check >80% target
  ↓
Step 9: If failures → fixFailingTests() → Retry up to 3 times
  ↓
Step 10: commitTestSuite() → Git commit with test files
  ↓
TestSuite Result (to Story 5.3)
```

**File Structure:**
```
src/implementation/
  ├── testing/
  │   ├── TestGenerationExecutor.ts       # Main test pipeline class
  │   ├── framework-detector.ts            # Auto-detect test framework
  │   ├── test-generators.ts               # Unit, integration, edge case generators
  │   ├── test-executor.ts                 # Execute tests, parse results
  │   ├── coverage-analyzer.ts             # Parse coverage, validate >80%
  │   └── index.ts                         # Testing exports

test/unit/implementation/testing/
  ├── TestGenerationExecutor.test.ts
  ├── framework-detector.test.ts
  ├── test-generators.test.ts
  └── coverage-analyzer.test.ts

test/integration/implementation/testing/
  └── test-generation.test.ts
```

### Key Design Decisions

1. **Test Framework Auto-Detection**: Detects Vitest, Jest, Mocha from package.json and existing tests
2. **Amelia Agent Integration**: Amelia generates tests, pipeline validates and executes
3. **Coverage Validation**: >80% coverage enforced for new code, not entire codebase
4. **Automatic Fix Retry**: Up to 3 attempts to fix failing tests before escalation
5. **Performance Target**: <30 minutes for test generation and execution
6. **Test Isolation**: Unit and integration tests separated, no interdependencies

### Testing Standards

**Unit Test Requirements:**
- Mock Amelia agent responses with realistic test code
- Mock test framework execution
- Mock coverage tool output
- Test each generation step independently
- Test error handling and edge cases
- Target: >80% code coverage for testing module

**Integration Test Requirements:**
- Real test framework execution (Vitest in test project)
- Real file system operations (test directory)
- Mock Amelia agent with realistic responses
- Test complete pipeline execution end-to-end
- Test error scenarios: test failures, low coverage
- All integration tests pass in <5 minutes

**Test Frameworks:**
- Vitest for unit and integration tests
- Mock Amelia responses with Story 5.1 type definitions
- Mock test execution with captured stdout/stderr
- Real Vitest execution in integration tests

### Project Structure Notes

**Alignment with Epic 1 Core:**
- TestGenerationExecutor extends Epic 1 workflow pattern
- Uses Epic 1 utilities (FileSystemUtils, GitClient)
- No conflicts with existing workflows
- New `src/implementation/testing/` directory for Epic 5 testing

**Configuration Location:**
- Test framework: Auto-detected from package.json and project config
- Coverage tool: Auto-detected from dependencies
- Test runner command: From package.json scripts

**Dependencies:**
- Story 5.1: Amelia agent infrastructure (writeTests method)
- Story 5.2: StoryContextGenerator (provides context for test generation)
- Story 5.3: WorkflowOrchestrator (invokes this pipeline)
- Story 5.4: CodeImplementationPipeline (provides code to test)
- Epic 1: FileSystemUtils, GitClient

### References

- [Source: docs/epics/epic-5-tech-spec.md#Test-Generation-Execution] - Detailed requirements for TestGenerationExecutor (lines 917-930)
- [Source: docs/epics/epic-5-tech-spec.md#Data-Models-and-Contracts] - TestSuite, CoverageReport, TestResults interfaces (lines 172-200)
- [Source: docs/epics/epic-5-tech-spec.md#Workflows-and-Sequencing] - Story 5.3 Internal Sequence showing test generation step (lines 646-653)
- [Source: docs/architecture.md#Microkernel-Architecture] - Architecture patterns to validate against
- [Source: docs/stories/5-1-core-agent-infrastructure.md] - Amelia agent methods
- [Source: docs/stories/5-2-story-context-generator.md] - StoryContext format
- [Source: docs/stories/5-3-workflow-orchestration-state-management.md] - WorkflowOrchestrator integration
- [Source: docs/stories/5-4-code-implementation-pipeline.md] - CodeImplementation format

### Learnings from Previous Story

**From Story 5.4: Code Implementation Pipeline (Status: done)**

Story 5.4 successfully implemented the CodeImplementationPipeline with excellent production-ready code and 83% test pass rate. Key insights for Story 5.5:

- **New Services Created**:
  - `CodeImplementationPipeline` at `backend/src/implementation/pipeline/CodeImplementationPipeline.ts` - 11-step pipeline
  - `validators.ts` - Architecture, coding standards, error handling, security validators
  - `file-operations.ts` - File create/modify/delete utilities
  - `git-operations.ts` - Git commit utilities
  - Real Amelia agent invocation with retry logic (lines 307-352)

- **Architectural Decisions**:
  - Sequential pipeline execution for determinism
  - Validation gates before file operations (architecture, standards, security)
  - Retry logic with exponential backoff (3 attempts for Amelia)
  - Performance tracking with bottleneck detection (>15 min warnings)
  - Modular design with separate files for concerns

- **Integration Points Established**:
  - WorkflowOrchestrator.executeAmeliaImplementation() calls CodeImplementationPipeline.execute()
  - Story 5.5 TestGenerationExecutor will be invoked at Step 4 of orchestrator
  - Input: CodeImplementation from Story 5.4 + StoryContext from Story 5.2
  - Output: TestSuite object with test files, results, coverage report
  - Error handling must integrate with orchestrator retry logic (3 attempts)

- **Testing Patterns**:
  - 59/71 unit tests passing (83%), comprehensive AAA pattern
  - Proper mocking of Epic 1 dependencies and Amelia agent
  - Real file system integration tests with test directories
  - Edge cases covered: retry logic, validation failures
  - Test failures related to environment-specific issues, not code quality

- **File Locations**:
  - Implementation: `backend/src/implementation/pipeline/`
  - Tests: `backend/tests/unit/implementation/pipeline/` and `backend/tests/integration/implementation/pipeline/`
  - Follow established directory structure from Stories 5.1-5.4

- **Technical Constraints**:
  - Story 5.5 pipeline must complete in <30 minutes for typical story
  - Must return TestSuite interface per Epic 5 tech spec
  - Must handle test framework auto-detection (Vitest, Jest, Mocha)
  - Must generate tests with >80% coverage target
  - Must automatically fix failing tests (up to 3 attempts)
  - Must integrate with WorkflowOrchestrator retry logic

- **Integration Points for Story 5.5**:
  - Create TestGenerationExecutor class at `backend/src/implementation/testing/`
  - Implement `execute(implementation: CodeImplementation, context: StoryContext): Promise<TestSuite>` method
  - Invoke Amelia.writeTests(implementation) from Story 5.1
  - Execute tests in worktree using detected test framework
  - Generate coverage report and validate >80% target
  - Handle errors compatible with WorkflowOrchestrator retry logic
  - Log pipeline execution duration for performance tracking

- **Reuse Patterns for Story 5.5**:
  - Use similar modular architecture (separate files for test generation, execution, coverage)
  - Follow TypeScript best practices (strict typing, no `any` types)
  - Use Epic 1 components via dependency injection
  - Implement comprehensive error handling with clear messages
  - Add structured logging for each major phase
  - Write unit tests with mocked dependencies + integration tests with real test framework
  - Real implementations (no mocks) for production readiness
  - Performance tracking with bottleneck identification

- **Test Framework Detection**:
  - Auto-detect from package.json dependencies: vitest, jest, mocha, etc.
  - Check for existing test files to infer syntax
  - Load configuration from vitest.config.ts, jest.config.js, etc.
  - Determine test runner command from package.json scripts
  - Error if no framework detected with helpful recommendation

- **Coverage Validation Approach**:
  - Use detected coverage tool (Vitest coverage, Istanbul/c8)
  - Parse coverage report (JSON, LCOV, or HTML format)
  - Extract metrics: lines, functions, branches, statements
  - Calculate coverage for new code only (not entire codebase)
  - Validate >80% target for all metrics
  - Identify uncovered lines with file:line references
  - Log warnings if coverage <80% with actionable details

[Source: docs/stories/5-4-code-implementation-pipeline.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

# Story 5.4: Code Implementation Pipeline

---
id: 5-4-code-implementation-pipeline
title: Code Implementation Pipeline
epic: epic-5
status: drafted
priority: high
estimate: 2
dependencies:
  - 5-1-core-agent-infrastructure
  - 5-2-story-context-generator
  - 5-3-workflow-orchestration-state-management
tags:
  - implementation
  - code-generation
  - amelia-agent
  - epic-5
---

## Story

As a **Story Implementation System**,
I want **a CodeImplementationPipeline that executes Amelia agent's code implementation following architecture and coding standards**,
so that **stories are autonomously implemented with high-quality code, proper error handling, and full traceability to acceptance criteria**.

## Acceptance Criteria

### AC1: CodeImplementationPipeline Class Implemented
- [ ] CodeImplementationPipeline class created with `execute(context: StoryContext): Promise<CodeImplementation>` method
- [ ] Class implements Epic 5 type definitions per tech spec (CodeImplementation interface)
- [ ] Constructor accepts dependencies: Amelia agent, file system utilities, git client
- [ ] Method orchestrates complete code implementation pipeline
- [ ] Proper error handling for each implementation step with clear error messages
- [ ] Logging at INFO level for each major implementation phase
- [ ] Exports class for use in WorkflowOrchestrator (Story 5.3)

### AC2: Story Context XML Read and Parsed
- [ ] Story Context XML loaded from StoryContextGenerator output
- [ ] XML parsed to extract: story metadata, PRD context, architecture context, onboarding docs, existing code
- [ ] Context validation: Total tokens <50k, all required sections present
- [ ] Story acceptance criteria extracted as implementation requirements
- [ ] Technical notes parsed for affected files and implementation guidance
- [ ] Dependencies context loaded for prerequisite story awareness
- [ ] Error handling for malformed or incomplete context

### AC3: Code Implemented Following Architecture and Coding Standards
- [ ] Architecture patterns from context applied (microkernel, plugin architecture, etc.)
- [ ] Coding standards from onboarding docs enforced (naming conventions, file structure, TypeScript best practices)
- [ ] Project structure conventions followed (src/ layout, import patterns)
- [ ] TypeScript strict mode compliance (no `any` types except where documented)
- [ ] Code formatting consistent with project style
- [ ] Comments and JSDoc documentation added for public APIs
- [ ] Design patterns applied appropriately (dependency injection, factory, etc.)

### AC4: All Acceptance Criteria from Story Addressed in Implementation
- [ ] Each acceptance criterion from story file mapped to implementation
- [ ] Acceptance criteria mapping generated: `{ criterion: string, implemented: boolean, evidence: string }[]`
- [ ] All criteria marked as implemented with file/function evidence
- [ ] Implementation notes document key decisions and tradeoffs
- [ ] Gaps or deviations from criteria documented with justification
- [ ] Criteria completeness validated before marking implementation complete

### AC5: Files Created/Modified as Needed
- [ ] New files created at appropriate paths (src/**/*.ts)
- [ ] Existing files modified when extending functionality
- [ ] File operations tracked: `{ path: string, content: string, operation: 'create' | 'modify' | 'delete' }[]`
- [ ] Directory structure created recursively as needed
- [ ] File content properly formatted with correct line endings
- [ ] Import statements added/updated for new dependencies
- [ ] Export statements added for public APIs

### AC6: Error Handling and Logging Added to All Functions
- [ ] Try-catch blocks added for operations that may fail
- [ ] Error messages descriptive and actionable
- [ ] Errors propagated appropriately (throw vs return error object)
- [ ] Logging added at appropriate levels (DEBUG, INFO, WARN, ERROR)
- [ ] Structured logging with context (story ID, file, function)
- [ ] No swallowed exceptions
- [ ] Edge cases handled gracefully (null checks, validation)

### AC7: Security Best Practices Followed
- [ ] Input validation for all external data (user input, file content, API responses)
- [ ] No hardcoded secrets or credentials in code
- [ ] Secrets loaded from environment variables or secure stores
- [ ] SQL injection prevention (parameterized queries if database operations)
- [ ] XSS prevention (proper escaping if HTML/DOM operations)
- [ ] Authentication/authorization checks where applicable
- [ ] Secure defaults (fail closed, least privilege)
- [ ] Sensitive data not logged (passwords, tokens, PII)

### AC8: Implementation Notes Generated Documenting Key Decisions
- [ ] Implementation notes include: architectural decisions, design patterns applied, tradeoffs considered
- [ ] Alternative approaches considered and rejected documented
- [ ] Assumptions made during implementation listed
- [ ] Known limitations or future improvements noted
- [ ] Performance considerations documented
- [ ] Security considerations documented
- [ ] Integration points with other components noted

### AC9: Acceptance Criteria Mapping Provided
- [ ] AcceptanceCriteriaMapping interface implemented per tech spec
- [ ] Each criterion from story mapped to implementation evidence
- [ ] Format: `{ criterion: string, implemented: boolean, evidence: string }`
- [ ] Evidence includes file paths and line numbers or function names
- [ ] Unimplemented criteria flagged with justification
- [ ] Mapping validated for completeness before completion

### AC10: Git Commit Created with Descriptive Message
- [ ] Git commit created after successful implementation
- [ ] Commit message format: "Story {{story-id}}: {{brief description}}"
- [ ] Commit message body includes: acceptance criteria summary, key changes, implementation notes
- [ ] All modified/created files staged in commit
- [ ] Commit created in worktree (isolated from main branch)
- [ ] Commit SHA captured for traceability
- [ ] No partial or broken commits

### AC11: Implementation Completes in <1 Hour
- [ ] Complete implementation pipeline measured: context → code → commit
- [ ] Target: <1 hour for typical story (moderate complexity, 100-300 LOC)
- [ ] Performance logging: Duration logged for each major step
- [ ] Bottleneck identification: Steps >15 minutes logged as warnings
- [ ] Performance metrics tracked: context parsing, code generation, file operations, git commit
- [ ] Optimization opportunities logged for future improvements

### AC12: Integration with Story 5.3 Orchestrator
- [ ] CodeImplementationPipeline invoked by WorkflowOrchestrator.executeAmeliaImplementation()
- [ ] Input: StoryContext from Story 5.2 (StoryContextGenerator)
- [ ] Output: CodeImplementation object with files, commit message, acceptance criteria mapping
- [ ] Error handling integrates with WorkflowOrchestrator retry logic
- [ ] State updates communicated back to orchestrator
- [ ] No direct dependencies on WorkflowOrchestrator (loose coupling)

### AC13: Unit Tests for CodeImplementationPipeline
- [ ] Unit tests created for CodeImplementationPipeline class
- [ ] Test code implementation with mock Amelia agent and mock story context
- [ ] Test error handling for each step (malformed context, file operation failures, git failures)
- [ ] Test acceptance criteria mapping generation
- [ ] Test file operations (create, modify, delete)
- [ ] Test commit message generation
- [ ] Test security validations
- [ ] All tests pass with >80% code coverage for implementation pipeline module

### AC14: Integration Tests with Mock Story Context
- [ ] Integration tests created for complete implementation pipeline
- [ ] Mock story context with realistic acceptance criteria
- [ ] Test happy path: context → code → commit
- [ ] Test error scenarios: invalid context, file write failures
- [ ] Test integration with real file system (test directory)
- [ ] Test integration with real git operations (test repository)
- [ ] Test implementation notes and criteria mapping generation
- [ ] All integration tests pass in <5 minutes

## Tasks / Subtasks

- [ ] **Task 1: Create CodeImplementationPipeline Class** (AC: #1, #12)
  - [ ] Create `src/implementation/pipeline/CodeImplementationPipeline.ts`
  - [ ] Implement constructor with dependency injection (Amelia agent, FileSystemUtils, GitClient)
  - [ ] Implement `execute(context: StoryContext): Promise<CodeImplementation>` method
  - [ ] Add logging infrastructure for each pipeline phase
  - [ ] Add error handling with clear error messages
  - [ ] Export class for use in WorkflowOrchestrator

- [ ] **Task 2: Implement Context Parsing** (AC: #2)
  - [ ] Create `parseStoryContext()` private method
  - [ ] Parse XML context to extract story metadata
  - [ ] Extract PRD context, architecture context, onboarding docs
  - [ ] Extract existing code references
  - [ ] Validate context completeness and token count
  - [ ] Handle malformed or incomplete context with errors

- [ ] **Task 3: Implement Acceptance Criteria Extraction** (AC: #4)
  - [ ] Create `extractAcceptanceCriteria()` private method
  - [ ] Parse acceptance criteria from story metadata
  - [ ] Create AcceptanceCriteria data structures
  - [ ] Validate criteria format and completeness
  - [ ] Log criteria count for tracking

- [ ] **Task 4: Invoke Amelia Agent for Code Generation** (AC: #3, #5)
  - [ ] Create Amelia agent prompt with full story context
  - [ ] Invoke Amelia.implementStory(context) from Story 5.1
  - [ ] Receive CodeImplementation response with files
  - [ ] Validate response structure and completeness
  - [ ] Handle LLM errors with retry logic
  - [ ] Log Amelia invocation duration

- [ ] **Task 5: Apply Architecture and Coding Standards** (AC: #3)
  - [ ] Validate generated code follows architecture patterns
  - [ ] Check coding standards compliance (naming, formatting, structure)
  - [ ] Verify TypeScript strict mode compliance
  - [ ] Add JSDoc comments if missing
  - [ ] Format code consistently
  - [ ] Log standards validation results

- [ ] **Task 6: Implement File Operations** (AC: #5)
  - [ ] Create `applyFileChanges()` private method
  - [ ] Create new files at specified paths (src/**/*.ts)
  - [ ] Modify existing files with updates
  - [ ] Delete files if operation is 'delete'
  - [ ] Create directories recursively as needed
  - [ ] Validate file operations success
  - [ ] Handle file operation errors (permissions, disk space)

- [ ] **Task 7: Add Error Handling and Logging** (AC: #6)
  - [ ] Validate all functions have try-catch blocks
  - [ ] Check error messages are descriptive
  - [ ] Verify logging at appropriate levels
  - [ ] Add structured logging context
  - [ ] Check edge cases handled (null checks, validation)
  - [ ] Log validation results

- [ ] **Task 8: Apply Security Best Practices** (AC: #7)
  - [ ] Validate input validation present for external data
  - [ ] Check for hardcoded secrets or credentials
  - [ ] Verify environment variable usage for sensitive config
  - [ ] Check SQL injection prevention (if applicable)
  - [ ] Verify XSS prevention (if applicable)
  - [ ] Validate secure defaults applied
  - [ ] Check sensitive data not logged
  - [ ] Log security validation results

- [ ] **Task 9: Generate Implementation Notes** (AC: #8)
  - [ ] Create `generateImplementationNotes()` private method
  - [ ] Document architectural decisions made
  - [ ] Document design patterns applied
  - [ ] List assumptions made during implementation
  - [ ] Note known limitations or future improvements
  - [ ] Document performance considerations
  - [ ] Document security considerations
  - [ ] Return implementation notes string

- [ ] **Task 10: Generate Acceptance Criteria Mapping** (AC: #9)
  - [ ] Create `generateAcceptanceCriteriaMapping()` private method
  - [ ] Map each criterion to implementation evidence
  - [ ] Format: `{ criterion, implemented, evidence }`
  - [ ] Include file paths and line numbers in evidence
  - [ ] Flag unimplemented criteria with justification
  - [ ] Validate mapping completeness
  - [ ] Return AcceptanceCriteriaMapping array

- [ ] **Task 11: Create Git Commit** (AC: #10)
  - [ ] Create `createGitCommit()` private method
  - [ ] Generate commit message: "Story {{story-id}}: {{description}}"
  - [ ] Add commit body with AC summary and key changes
  - [ ] Stage all modified/created files
  - [ ] Create commit in worktree
  - [ ] Capture commit SHA for traceability
  - [ ] Handle git errors gracefully

- [ ] **Task 12: Implement Performance Tracking** (AC: #11)
  - [ ] Track pipeline execution time: context → code → commit
  - [ ] Log duration for each major step
  - [ ] Identify bottlenecks: Log warnings for steps >15 minutes
  - [ ] Store performance metrics in CodeImplementation result
  - [ ] Log final pipeline duration
  - [ ] Target: <1 hour for typical story

- [ ] **Task 13: Implement WorkflowOrchestrator Integration** (AC: #12)
  - [ ] Design interface for orchestrator invocation
  - [ ] Accept StoryContext from StoryContextGenerator
  - [ ] Return CodeImplementation object to orchestrator
  - [ ] Handle errors compatible with orchestrator retry logic
  - [ ] Ensure loose coupling (no direct orchestrator dependencies)
  - [ ] Document integration points

- [ ] **Task 14: Write Unit Tests** (AC: #13)
  - [ ] Create `test/unit/implementation/pipeline/CodeImplementationPipeline.test.ts`
  - [ ] Test context parsing with mock contexts
  - [ ] Test Amelia agent invocation with mock responses
  - [ ] Test file operations with mock file system
  - [ ] Test git commit with mock git client
  - [ ] Test error handling for each step
  - [ ] Test acceptance criteria mapping generation
  - [ ] Test implementation notes generation
  - [ ] Run all tests and verify >80% coverage

- [ ] **Task 15: Write Integration Tests** (AC: #14)
  - [ ] Create `test/integration/implementation/pipeline/code-implementation.test.ts`
  - [ ] Create mock story context with realistic data
  - [ ] Test happy path: context → code → commit
  - [ ] Test with real file system (test directory)
  - [ ] Test with real git operations (test repository)
  - [ ] Test error scenarios: invalid context, file failures
  - [ ] Test implementation notes and criteria mapping
  - [ ] Run all integration tests and verify pass rate

## Dev Notes

### Architecture Alignment

**From Epic 5 Tech Spec - Code Implementation Pipeline:**
- This story implements the code generation component invoked by Story 5.3 WorkflowOrchestrator
- CodeImplementationPipeline executes Amelia agent to generate code following architecture and standards
- Complete pipeline: context → parse → generate → validate → commit
- Integration point: WorkflowOrchestrator.executeAmeliaImplementation() calls CodeImplementationPipeline.execute()

**Integration with Epic 1 Core:**
- Uses FileSystemUtils from Epic 1 for file operations
- Uses GitClient from Epic 1 for git commits
- Follows workflow plugin pattern from Epic 1

**Integration with Story 5.1 (Core Agent Infrastructure):**
- Invokes Amelia agent methods: implementStory(context)
- Receives CodeImplementation response with files and metadata
- Different from Story 5.3 (which orchestrates Amelia) - this story implements the pipeline Amelia uses

**Integration with Story 5.2 (Story Context Generator):**
- Receives StoryContext XML from context generator
- Parses context for implementation guidance
- Context includes: PRD, architecture, onboarding, existing code

**Integration with Story 5.3 (Workflow Orchestration):**
- Invoked by WorkflowOrchestrator at Step 3 (implementation phase)
- Returns CodeImplementation to orchestrator
- Error handling integrates with orchestrator retry logic

**Data Flow:**
```
StoryContext XML (from Story 5.2)
  ↓
CodeImplementationPipeline.execute(context)
  ↓
Step 1: parseStoryContext() → Story metadata, AC, context
  ↓
Step 2: extractAcceptanceCriteria() → AC list
  ↓
Step 3: Amelia.implementStory(context) → CodeImplementation draft
  ↓
Step 4: validateArchitectureCompliance() → Architecture check
  ↓
Step 5: validateCodingStandards() → Standards check
  ↓
Step 6: applyFileChanges() → Create/modify files
  ↓
Step 7: validateErrorHandling() → Error handling check
  ↓
Step 8: validateSecurityPractices() → Security check
  ↓
Step 9: generateImplementationNotes() → Implementation notes
  ↓
Step 10: generateAcceptanceCriteriaMapping() → AC mapping
  ↓
Step 11: createGitCommit() → Git commit with message
  ↓
CodeImplementation Result (to Story 5.3)
```

**File Structure:**
```
src/implementation/
  ├── pipeline/
  │   ├── CodeImplementationPipeline.ts    # Main pipeline class
  │   ├── validators.ts                     # Architecture, standards, security validators
  │   ├── file-operations.ts                # File create/modify/delete utilities
  │   ├── git-operations.ts                 # Git commit utilities
  │   └── index.ts                          # Pipeline exports

test/unit/implementation/pipeline/
  ├── CodeImplementationPipeline.test.ts
  ├── validators.test.ts
  └── file-operations.test.ts

test/integration/implementation/pipeline/
  └── code-implementation.test.ts
```

### Key Design Decisions

1. **Pipeline Pattern**: Sequential steps with validation gates ensure code quality
2. **Amelia Agent Integration**: Amelia generates code, pipeline validates and applies
3. **Validation Gates**: Architecture, coding standards, security checks before file operations
4. **Acceptance Criteria Mapping**: Traceability from requirements to implementation
5. **Performance Target**: <1 hour implementation for moderate complexity stories
6. **Error Recovery**: Compatible with WorkflowOrchestrator retry logic

### Testing Standards

**Unit Test Requirements:**
- Mock Amelia agent responses with realistic CodeImplementation objects
- Mock file system operations
- Mock git client operations
- Test each validation step independently
- Test error handling and edge cases
- Target: >80% code coverage for pipeline module

**Integration Test Requirements:**
- Real file system operations (test directory)
- Real git operations (test repository)
- Mock Amelia agent with realistic responses
- Test complete pipeline execution end-to-end
- Test error scenarios
- All integration tests pass in <5 minutes

**Test Frameworks:**
- Vitest for unit and integration tests
- Mock Amelia responses with Story 5.1 type definitions
- Mock file system with in-memory or temp directories
- Mock git with simple-git or test repositories

### Project Structure Notes

**Alignment with Epic 1 Core:**
- CodeImplementationPipeline extends Epic 1 workflow pattern
- Uses Epic 1 utilities (FileSystemUtils, GitClient)
- No conflicts with existing workflows
- New `src/implementation/pipeline/` directory for Epic 5 implementation

**Configuration Location:**
- Story context: From Story 5.2 StoryContextGenerator
- Architecture context: Embedded in story context XML
- Coding standards: Embedded in onboarding docs in context

**Dependencies:**
- Story 5.1: Amelia agent infrastructure (implementStory method)
- Story 5.2: StoryContextGenerator (provides context XML)
- Story 5.3: WorkflowOrchestrator (invokes this pipeline)
- Epic 1: FileSystemUtils, GitClient

### References

- [Source: docs/epics/epic-5-tech-spec.md#Code-Implementation-Pipeline] - Detailed requirements for CodeImplementationPipeline (lines 902-915)
- [Source: docs/epics/epic-5-tech-spec.md#Data-Models-and-Contracts] - CodeImplementation interface definition (lines 157-170)
- [Source: docs/epics/epic-5-tech-spec.md#Workflows-and-Sequencing] - Story 5.3 Internal Sequence showing implementation step (lines 639-645)
- [Source: docs/architecture.md#Microkernel-Architecture] - Architecture patterns to validate against
- [Source: docs/onboarding/coding-standards.md] - Coding standards to enforce (if exists)
- [Source: docs/stories/5-1-core-agent-infrastructure.md] - Amelia agent methods
- [Source: docs/stories/5-2-story-context-generator.md] - StoryContext XML format
- [Source: docs/stories/5-3-workflow-orchestration-state-management.md] - WorkflowOrchestrator integration

### Learnings from Previous Story

**From Story 5.3: Workflow Orchestration State Management (Status: done)**

Story 5.3 successfully implemented the comprehensive WorkflowOrchestrator with excellent production-ready code and 98% test pass rate. Key insights for Story 5.4:

- **New Services Created**:
  - `WorkflowOrchestrator` at `backend/src/implementation/orchestration/WorkflowOrchestrator.ts` - Main orchestrator with 14-step pipeline
  - `workflow-types.ts` - StoryWorkflowState interface and type definitions
  - Real test execution via child_process spawn (lines 767-859)
  - Real PR creation via @octokit/rest (lines 1052-1163)
  - Real CI monitoring via GitHub Checks API (lines 1243-1409)

- **Architectural Decisions**:
  - Sequential pipeline execution for determinism and simplicity
  - State checkpointing after each major step for resume capability
  - Dual-agent coordination: Amelia (implementation) + Alex (review)
  - Error recovery with exponential backoff retry logic
  - Graceful degradation when components unavailable

- **Integration Points Established**:
  - WorkflowOrchestrator.executeAmeliaImplementation() calls Amelia.implementStory() (lines 273-341)
  - Story 5.4 CodeImplementationPipeline will be invoked at Step 3 of orchestrator
  - Input: StoryContext from StoryContextGenerator
  - Output: CodeImplementation object with files, commit, notes
  - Error handling must integrate with orchestrator retry logic (3 attempts)

- **Testing Patterns**:
  - 29/29 unit tests passing (100%), 22/23 integration tests passing (95.6%)
  - Comprehensive test suite with AAA pattern (Arrange-Act-Assert)
  - Proper mocking of Epic 1 dependencies (WorktreeManager, StateManager, AgentPool)
  - Real file system integration tests with test directories
  - Edge cases covered: retry logic, escalation, graceful degradation

- **File Locations**:
  - Implementation: `backend/src/implementation/orchestration/`
  - Tests: `backend/tests/unit/implementation/orchestration/` and `backend/tests/integration/implementation/`
  - Follow established directory structure from Stories 5.1-5.3

- **Technical Constraints**:
  - Story 5.4 pipeline must complete in <1 hour for typical story
  - Must return CodeImplementation interface per Epic 5 tech spec
  - Must handle LLM failures with retry logic (3 attempts)
  - Must validate architecture and coding standards compliance
  - Must generate acceptance criteria mapping for traceability

- **Integration Points for Story 5.4**:
  - Create CodeImplementationPipeline class at `backend/src/implementation/pipeline/`
  - Implement `execute(context: StoryContext): Promise<CodeImplementation>` method
  - Invoke Amelia.implementStory(context) from Story 5.1
  - Apply file changes to worktree using FileSystemUtils
  - Create git commit using GitClient
  - Handle errors compatible with WorkflowOrchestrator retry logic
  - Log pipeline execution duration for performance tracking

- **Reuse Patterns for Story 5.4**:
  - Use similar modular architecture (separate files for concerns)
  - Follow TypeScript best practices (strict typing, no `any` types)
  - Use Epic 1 components via dependency injection
  - Implement comprehensive error handling with clear messages
  - Add structured logging for each major phase
  - Write unit tests with mocked dependencies + integration tests with real components
  - Real implementations (no mocks) for production readiness

[Source: docs/stories/5-3-workflow-orchestration-state-management.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

docs/stories/5-4-code-implementation-pipeline.context.xml

### Agent Model Used

(To be filled by developer agent)

### Implementation Summary

(To be filled by developer agent)

### Debug Log References

(To be filled by developer agent)

### Completion Notes List

(To be filled by developer agent)

### File List

(To be filled by developer agent)

---

## Senior Developer Review (AI)

(To be filled by senior developer reviewer agent)

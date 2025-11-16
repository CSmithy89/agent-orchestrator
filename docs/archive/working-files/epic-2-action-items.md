# Epic 2: Deferred Technical Debt & Action Items

**Date**: 2025-11-07
**Source**: Epic 1 Retrospective + Story 1.10 Deferred Work

---

## Overview

This document tracks technical debt and deferred work from Epic 1 that should be addressed during Epic 2 or subsequent epics.

---

## High Priority Action Items from Epic 1 Retrospective

### ✅ Completed Before Epic 2

1. **Standard Test Configuration Documentation** ✅
   - **Status**: COMPLETE
   - **Document**: `docs/test-setup-guide.md`
   - **Coverage**: Git config, fork pool setup, async patterns, coverage targets
   - **Date Completed**: 2025-11-07

2. **Async Pattern Guidelines** ✅
   - **Status**: COMPLETE
   - **Document**: `docs/async-patterns-guide.md`
   - **Coverage**: File I/O patterns, promise patterns, common mistakes, testing
   - **Date Completed**: 2025-11-07

3. **Documentation Tracking Improvement** ✅
   - **Status**: COMPLETE
   - **Document**: `docs/definition-of-done.md`
   - **Enhancement**: Added Section 6 "Documentation Tracking" with detailed checklist
   - **Key Improvement**: Prevents task checkbox/completion mismatches
   - **Date Completed**: 2025-11-07

### 📋 To Address During Epic 2

4. **Plan Integration Work from Story 1.10**
   - **Status**: DOCUMENTED (this file)
   - **Details**: See "Deferred Integration Tasks" section below
   - **Timeline**: Address incrementally during Epic 2+

---

## Deferred Integration Tasks from Story 1.10

These tasks were identified during Story 1.10 code review as deferred integration work. The foundational infrastructure is complete and production-ready, but integration with existing components should be completed incrementally.

---

### Task 3: LLM Client Integration with Error Handling

**Story 1.10 Reference**: Lines 54-65
**Code Review Reference**: Lines 1228-1233

#### Current State
- ✅ Infrastructure ready:
  - `LLMAPIError` type defined in `backend/src/types/errors.types.ts`
  - `createLLMRetryHandler()` helper in `backend/src/core/RetryHandler.ts`
  - Error classification system (rate limit, timeout, auth errors)
  - Exponential backoff with jitter

- ❌ Not yet implemented:
  - Actual wrapping of Anthropic/OpenAI/Zhipu client calls with retry logic
  - Provider-specific error response parsing
  - Retry-After header handling for rate limits
  - Provider fallback (optional)

#### Implementation Plan

**When**: During Epic 2 (Story 2-3 or 2-4 when LLM clients are actively used)

**Work Items**:
1. Wrap LLM Factory client creation with error handling
   ```typescript
   // Update backend/src/llm/LLMFactory.ts
   const client = await retryHandler.executeWithRetry(
     () => createAnthropicClient(apiKey),
     (error) => isRetryableError(error)
   );
   ```

2. Add error handling to all LLM API calls:
   - Anthropic: `messages.create()` calls
   - OpenAI: `chat.completions.create()` calls
   - Zhipu: Corresponding API calls

3. Implement provider-specific error handling:
   - 429 (Rate Limit): Retry with Retry-After header, exponential backoff
   - 500-599 (Server Error): Retry up to 3 times
   - 401/403 (Auth Error): Don't retry, escalate immediately
   - Network errors: Retry up to 3 times

4. Add logging for all LLM failures:
   ```typescript
   logger.error('LLM API call failed', {
     provider: 'anthropic',
     model: 'claude-sonnet-4-5',
     promptLength: prompt.length,
     statusCode: error.status,
     retryCount: attempt,
     error: error.message
   });
   ```

5. (Optional) Implement provider fallback:
   - If Anthropic fails after retries, try OpenAI
   - If OpenAI fails, try Zhipu
   - Log fallback attempts

**Acceptance Criteria**:
- [ ] All LLM client calls wrapped with retry logic
- [ ] Rate limits handled with Retry-After header
- [ ] Auth errors don't retry (immediate escalation)
- [ ] Server errors retry up to 3 times
- [ ] All LLM failures logged with context
- [ ] Tests added for LLM error scenarios

**Estimated Effort**: 4-6 hours

---

### Task 4: Git Operation Error Handling & Cleanup

**Story 1.10 Reference**: Lines 67-80
**Code Review Reference**: Lines 1235-1240

#### Current State
- ✅ Infrastructure ready:
  - `GitOperationError` type defined
  - `createGitRetryHandler()` helper
  - Error classification for git operations

- ❌ Not yet implemented:
  - Cleanup logic in WorktreeManager operations
  - Partial state rollback on failures
  - Enhanced error messages with git command details

#### Implementation Plan

**When**: During Epic 2 or Epic 3 (as WorktreeManager usage increases)

**Work Items**:
1. Add try-catch with cleanup to `WorktreeManager.createWorktree()`:
   ```typescript
   async createWorktree(storyId: string): Promise<Worktree> {
     const worktreePath = `/wt/story-${storyId}/`;
     const branch = `story/${storyId}`;

     try {
       await this.git.worktree(['add', worktreePath, '-b', branch, 'main']);
       // ... track worktree
       return worktree;
     } catch (error) {
       // Cleanup partial state
       try {
         await this.git.worktree(['remove', worktreePath, '--force']);
       } catch (cleanupError) {
         logger.error('Failed to cleanup worktree', {
           storyId,
           worktreePath,
           error: cleanupError.message
         });
       }

       throw new GitOperationError(
         `Failed to create worktree for story ${storyId}`,
         'WORKTREE_CREATE_FAILED',
         {
           storyId,
           worktreePath,
           branch,
           command: 'git worktree add',
           originalError: error.message
         }
       );
     }
   }
   ```

2. Add cleanup logic to other git operations:
   - `WorktreeManager.removeWorktree()` - cleanup orphaned directories
   - `StateManager.saveState()` - rollback on commit failure
   - Any git push operations - handle auth and branch protection errors

3. Enhance error messages:
   - Include git command that failed
   - Include working directory
   - Include exit code
   - Provide actionable resolution steps

4. Log all git operations:
   ```typescript
   logger.debug('Git operation', {
     command: 'git worktree add',
     args: [worktreePath, '-b', branch, 'main'],
     workingDirectory: this.repoPath
   });
   ```

**Acceptance Criteria**:
- [ ] All WorktreeManager operations have try-catch with cleanup
- [ ] Partial state cleaned up on failures
- [ ] Error messages include git command details
- [ ] All git operations logged
- [ ] Tests added for git error scenarios

**Estimated Effort**: 3-4 hours

---

### Task 7: Multi-Project Graceful Degradation

**Story 1.10 Reference**: Lines 120-130
**Code Review Reference**: Lines 1242-1247

#### Current State
- ✅ Infrastructure ready:
  - Error classification system
  - Recovery strategies per error type
  - Error logging with context

- ❌ Not yet implemented:
  - Promise.allSettled pattern for project isolation
  - Project-level error boundaries
  - Project status tracking (active, errored)
  - Escalation for failed projects

#### Implementation Plan

**When**: During Epic 5 (Story Implementation Automation) or when multi-project orchestration is implemented

**Work Items**:
1. Implement project isolation in orchestrator:
   ```typescript
   class Orchestrator {
     async runProjects(projectIds: string[]): Promise<void> {
       const results = await Promise.allSettled(
         projectIds.map(id => this.runProject(id))
       );

       // Process results - log failures but continue
       results.forEach((result, index) => {
         const projectId = projectIds[index];

         if (result.status === 'rejected') {
           logger.error(`Project ${projectId} failed`, {
             projectId,
             error: result.reason.message,
             stack: result.reason.stack
           });

           // Update project state
           this.stateManager.updateProjectStatus(projectId, 'error');

           // Escalate to user
           this.escalationQueue.add({
             projectId,
             type: 'project_failure',
             message: `Project ${projectId} failed: ${result.reason.message}`,
             severity: 'high',
             timestamp: new Date()
           });
         } else {
           logger.info(`Project ${projectId} completed successfully`);
           this.stateManager.updateProjectStatus(projectId, 'completed');
         }
       });

       // Summary
       const succeeded = results.filter(r => r.status === 'fulfilled').length;
       const failed = results.filter(r => r.status === 'rejected').length;
       logger.info(`Project execution complete: ${succeeded} succeeded, ${failed} failed`);
     }

     async runProject(projectId: string): Promise<void> {
       try {
         // Project execution logic
         await this.workflowEngine.executeProject(projectId);
       } catch (error) {
         // Let error propagate to Promise.allSettled
         throw new ProjectExecutionError(
           `Failed to execute project ${projectId}`,
           'PROJECT_EXECUTION_FAILED',
           { projectId, error: error.message }
         );
       }
     }
   }
   ```

2. Add project status tracking to StateManager:
   - Project states: 'pending', 'active', 'completed', 'error'
   - Track error count per project
   - Support manual retry of failed projects

3. Create project-level error summary:
   - Failed projects list
   - Error reasons
   - Retry availability

4. Don't let one project crash orchestrator:
   - Use Promise.allSettled (doesn't reject if some fail)
   - Isolate project execution contexts
   - Log and continue on failure

**Acceptance Criteria**:
- [ ] Promise.allSettled used for multi-project execution
- [ ] Failed projects logged but don't crash orchestrator
- [ ] Project status tracked (pending, active, completed, error)
- [ ] Escalation queue notified of project failures
- [ ] Project error summary available
- [ ] Integration test: one project fails, others continue

**Estimated Effort**: 4-6 hours

---

### Task 12: Integration with Existing Core Components

**Story 1.10 Reference**: Lines 202-208
**Code Review Reference**: Lines 1249-1254

#### Current State
- ✅ Infrastructure ready:
  - `ErrorHandler` class with recovery and escalation
  - `RetryHandler` with exponential backoff
  - `Logger` with structured logging
  - Error types for all component failures

- ❌ Not yet implemented:
  - Wrapping LLMFactory.createClient() with error handling
  - Wrapping AgentPool.invokeAgent() with retry logic
  - Wrapping StateManager.saveState() with corruption detection
  - Wrapping WorkflowEngine.executeStep() with recovery logic

#### Implementation Plan

**When**: Incrementally during Epic 2-5 as components are enhanced

**Work Items**:

1. **Integrate with LLMFactory** (Epic 2 - Story 2-3 or 2-4):
   ```typescript
   // backend/src/core/LLMFactory.ts
   async createClient(config: LLMConfig): Promise<LLMClient> {
     try {
       return await retryHandler.executeWithRetry(
         () => this.initializeClient(config),
         (error) => isRetryableError(error)
       );
     } catch (error) {
       await ErrorHandler.handleError(error, {
         operation: 'LLMFactory.createClient',
         provider: config.provider,
         severity: 'high'
       });
       throw error;
     }
   }
   ```

2. **Integrate with AgentPool** (Epic 2 - Story 2-3 or 2-4):
   ```typescript
   // backend/src/core/AgentPool.ts
   async invokeAgent(agentId: string, prompt: string): Promise<string> {
     try {
       return await retryHandler.executeWithRetry(
         () => this.callAgent(agentId, prompt),
         (error) => error instanceof LLMAPIError
       );
     } catch (error) {
       await ErrorHandler.handleError(error, {
         operation: 'AgentPool.invokeAgent',
         agentId,
         promptLength: prompt.length,
         severity: 'high'
       });
       throw new AgentExecutionError(
         `Failed to invoke agent ${agentId}`,
         'AGENT_INVOCATION_FAILED',
         { agentId, error: error.message }
       );
     }
   }
   ```

3. **Integrate with StateManager** (Epic 1 or 2):
   ```typescript
   // backend/src/core/StateManager.ts
   async saveState(state: WorkflowState): Promise<void> {
     try {
       // Validate state before saving (corruption detection)
       this.validateState(state);

       // Save with error handling
       await fs.writeFile(this.statePath, JSON.stringify(state, null, 2));

       logger.debug('State saved successfully', {
         statePath: this.statePath,
         stateSize: JSON.stringify(state).length
       });
     } catch (error) {
       if (error instanceof SyntaxError) {
         throw new StateCorruptionError(
           'State corruption detected',
           'STATE_VALIDATION_FAILED',
           { statePath: this.statePath, error: error.message }
         );
       }

       await ErrorHandler.handleError(error, {
         operation: 'StateManager.saveState',
         statePath: this.statePath,
         severity: 'critical'
       });
       throw error;
     }
   }

   validateState(state: WorkflowState): void {
     // Check required fields exist
     if (!state.projectId || !state.workflowName) {
       throw new StateCorruptionError(
         'Invalid state: missing required fields',
         'STATE_INVALID',
         { state }
       );
     }
   }
   ```

4. **Integrate with WorkflowEngine** (Epic 2 - Story 2-5):
   ```typescript
   // backend/src/core/WorkflowEngine.ts
   async executeStep(step: WorkflowStep, context: Context): Promise<StepResult> {
     try {
       logger.info('Executing workflow step', {
         stepNumber: step.number,
         stepGoal: step.goal
       });

       const result = await this.runStep(step, context);

       logger.info('Step completed successfully', {
         stepNumber: step.number,
         duration: result.duration
       });

       return result;
     } catch (error) {
       // Classify error and apply recovery strategy
       const recoveryStrategy = ErrorHandler.getRecoveryStrategy(error);

       if (recoveryStrategy === 'retry') {
         logger.warn('Step failed, attempting retry', {
           stepNumber: step.number,
           error: error.message
         });

         // Retry the step
         return await retryHandler.executeWithRetry(
           () => this.runStep(step, context),
           (error) => isRetryableError(error)
         );
       }

       // Escalate if recovery not possible
       await ErrorHandler.handleError(error, {
         operation: 'WorkflowEngine.executeStep',
         stepNumber: step.number,
         stepGoal: step.goal,
         severity: 'high'
       });

       throw new WorkflowExecutionError(
         `Step ${step.number} failed: ${step.goal}`,
         'STEP_EXECUTION_FAILED',
         { stepNumber: step.number, stepGoal: step.goal, error: error.message }
       );
     }
   }
   ```

**Acceptance Criteria**:
- [ ] LLMFactory wrapped with error handling
- [ ] AgentPool wrapped with retry logic
- [ ] StateManager wrapped with corruption detection
- [ ] WorkflowEngine wrapped with recovery logic
- [ ] All component errors logged with context
- [ ] Tests added for each integration

**Estimated Effort**: 6-8 hours (spread across multiple stories)

---

## Additional Integration Tests (Deferred from Task 13)

The following integration tests were deferred from Story 1.10 and should be implemented as the integration work above is completed:

### Integration Tests to Add

1. **LLM Retry Scenarios**:
   - [ ] Test: LLM API returns 429 → retry with backoff → success
   - [ ] Test: LLM API returns 429 → max retries → escalation
   - [ ] Test: LLM API returns 500 → retry 3x → success
   - [ ] Test: LLM API returns 401 → don't retry → escalate immediately
   - [ ] Test: LLM timeout → retry 3x → success

2. **Git Error Scenarios**:
   - [ ] Test: Git worktree create fails → cleanup partial state
   - [ ] Test: Git push fails → log error → escalate (no retry)
   - [ ] Test: Git commit fails → rollback changes
   - [ ] Test: Git clone fails → clean up directory

3. **Multi-Project Isolation**:
   - [ ] Test: 3 projects run, 1 fails → other 2 complete successfully
   - [ ] Test: Failed project added to escalation queue
   - [ ] Test: Project status tracked correctly (completed vs error)

4. **E2E Workflow Tests**:
   - [ ] Test: Complete workflow with LLM failure → retry → success
   - [ ] Test: Complete workflow with max retries → escalation → user notified
   - [ ] Test: State recovery after error and orchestrator restart

**Estimated Effort**: 4-6 hours

---

## Implementation Strategy

### Phased Approach

**Phase 1: Epic 2 (Analysis Phase Automation)**
- Implement Task 3: LLM Client Integration (Stories 2-3 or 2-4)
- Implement Task 12 (partial): LLMFactory and AgentPool integration
- Add LLM retry integration tests

**Phase 2: Epic 3 (Planning Phase Automation)**
- Implement Task 12 (partial): WorkflowEngine integration
- Add workflow execution integration tests

**Phase 3: Epic 4 (Solutioning Phase Automation)**
- Implement Task 4: Git Operation Error Handling
- Implement Task 12 (partial): StateManager integration
- Add git error integration tests

**Phase 4: Epic 5 (Story Implementation Automation)**
- Implement Task 7: Multi-Project Graceful Degradation
- Add multi-project isolation integration tests
- Complete any remaining Task 12 integrations

**Phase 5: Epic 6 (Remote Access & Monitoring)**
- Integrate error metrics with dashboard
- Add E2E workflow tests with error scenarios

---

## Tracking

**Owner**: Technical Lead / Architect
**Status**: PLANNED
**Next Review**: Before Epic 2 Sprint Planning

### Checklist for Epic 2 Planning
- [ ] Review this document with team
- [ ] Assign deferred tasks to appropriate Epic 2 stories
- [ ] Update tech-spec-epic-2.md with integration requirements
- [ ] Add integration test requirements to story acceptance criteria
- [ ] Track progress in sprint-status.yaml

---

## References

- **Story 1.10**: `docs/archive/epic-1-stories/1-10-error-handling-recovery-infrastructure.md`
- **Epic 1 Retrospective**: `docs/retrospective-epic-1.md`
- **Error Handling Infrastructure**: `backend/src/core/ErrorHandler.ts`
- **Retry Logic**: `backend/src/core/RetryHandler.ts`
- **Error Types**: `backend/src/types/errors.types.ts`

---

**Last Updated**: 2025-11-07
**Version**: 1.0

# Story 1.4: Agent Pool & Lifecycle Management

Status: ready-for-dev

## Story

As an orchestrator core developer,
I want to manage agent instances with proper lifecycle and resource cleanup,
So that agents can be created with specific LLMs and contexts, then cleaned up after use.

## Acceptance Criteria

1. **AgentPool Class Implementation**
   - Implement AgentPool class that manages active agent instances
   - Track active agents in a Map<string, Agent> structure
   - Support configurable max concurrent agents limit (default: 3)
   - Implement agent task queue for requests when pool at capacity

2. **Agent Creation (createAgent)**
   - createAgent(name, llmConfig, context) method creates agent with project-configured LLM
   - llmConfig retrieved from `.bmad/project-config.yaml` agent_assignments section
   - Support any provider configured in LLMFactory (Anthropic, OpenAI, Zhipu)
   - Load agent persona from `bmad/bmm/agents/{name}.md`
   - Inject LLMClient (from LLMFactory), context (onboarding, docs, workflow state) into agent
   - Generate unique agent ID for tracking
   - Emit `agent.started` event on creation

3. **Agent Context Injection**
   - Build AgentContext with onboarding docs, previous phase outputs, current task description
   - Optimize context size to minimize tokens (<200k token limit)
   - Exclude irrelevant history and excessive prior conversations

4. **Agent Invocation**
   - invokeAgent(agentId, prompt) invokes agent with prompt and returns LLM response
   - Track agent execution time (startTime to endTime)
   - Estimate and track cost per provider pricing
   - Log all LLM requests/responses for debugging (exclude API keys)

5. **Agent Cleanup (destroyAgent)**
   - destroyAgent(id) method cleans up agent resources within 30 seconds
   - Save execution logs before cleanup
   - Release LLM client connections
   - Remove agent from activeAgents map
   - Update cost tracking with final numbers
   - Emit `agent.completed` event on cleanup

6. **Resource Management**
   - Enforce concurrent agent limits per project
   - Queue agent tasks when pool at capacity
   - Implement fair scheduling for queued tasks
   - Monitor agent health and track potential hung agents

7. **Query Operations**
   - getActiveAgents() returns list of currently active agents
   - Include agent details: id, name, persona, startTime, estimatedCost
   - Support queries for dashboard integration

8. **Cost Tracking**
   - Track execution time per agent
   - Estimate cost based on provider pricing and token usage
   - Aggregate costs by agent, by workflow, by project
   - Expose cost metrics for Cost-Quality Optimizer integration

## Tasks / Subtasks

- [ ] Task 1: Define Agent and AgentContext interfaces (AC: #1, #3)
  - [ ] Create Agent interface with id, name, persona, llmClient, context, startTime, estimatedCost
  - [ ] Create AgentContext interface with onboarding docs, workflow state, task description
  - [ ] Create AgentTask interface for queue management
  - [ ] Add TypeScript type definitions to src/types/agent.ts

- [ ] Task 2: Implement AgentPool class skeleton (AC: #1)
  - [ ] Create src/core/AgentPool.ts
  - [ ] Initialize activeAgents Map, agentQueue array, maxConcurrentAgents config
  - [ ] Implement constructor with dependency injection for LLMFactory
  - [ ] Add basic logging infrastructure

- [ ] Task 3: Implement createAgent method (AC: #2, #3)
  - [ ] Load agent_assignments from ProjectConfig for specified agent name
  - [ ] Validate agent name exists in config
  - [ ] Call LLMFactory.createClient(llmConfig) to get LLMClient
  - [ ] Load persona markdown from bmad/bmm/agents/{name}.md
  - [ ] Build AgentContext with provided context parameter
  - [ ] Generate unique agent ID (UUID or timestamp-based)
  - [ ] Create Agent object and add to activeAgents map
  - [ ] Emit agent.started event via event bus
  - [ ] Handle agent creation errors with clear messages

- [ ] Task 4: Implement agent queueing logic (AC: #1, #6)
  - [ ] Check if pool at capacity in createAgent
  - [ ] Add task to agentQueue if at capacity
  - [ ] Return Promise that resolves when agent created
  - [ ] Implement queue processing on agent destruction
  - [ ] Add queue priority logic (FIFO by default)
  - [ ] Test queue behavior with concurrent requests

- [ ] Task 5: Implement invokeAgent method (AC: #4)
  - [ ] Retrieve agent from activeAgents map by ID
  - [ ] Validate agent exists
  - [ ] Call agent.llmClient.invoke(prompt) with provided prompt
  - [ ] Track request timestamp for duration measurement
  - [ ] Log request/response (sanitize API keys)
  - [ ] Update agent estimatedCost based on token usage
  - [ ] Return LLM response to caller
  - [ ] Handle LLM invocation errors with retry logic

- [ ] Task 6: Implement destroyAgent method (AC: #5)
  - [ ] Retrieve agent from activeAgents map
  - [ ] Calculate final execution time (endTime - startTime)
  - [ ] Save execution logs to file or database
  - [ ] Release LLM client connection gracefully
  - [ ] Remove agent from activeAgents map
  - [ ] Emit agent.completed event with cost/time metrics
  - [ ] Process next queued task if any
  - [ ] Ensure cleanup completes within 30 seconds (timeout)

- [ ] Task 7: Implement resource limits enforcement (AC: #6)
  - [ ] Add enforceResourceLimits() private method
  - [ ] Check current activeAgents.size against maxConcurrentAgents
  - [ ] Prevent new agent creation if at capacity
  - [ ] Add agent health monitoring (detect hung agents)
  - [ ] Implement automatic cleanup for agents exceeding time threshold
  - [ ] Log resource limit violations

- [ ] Task 8: Implement query methods (AC: #7)
  - [ ] Implement getActiveAgents() returning Agent[]
  - [ ] Add filtering options (by name, by start time)
  - [ ] Implement getAgentById(id) helper
  - [ ] Add getQueuedTasks() for monitoring

- [ ] Task 9: Implement cost tracking (AC: #8)
  - [ ] Track token usage per agent invocation
  - [ ] Calculate cost based on provider pricing (Anthropic/OpenAI/Zhipu)
  - [ ] Aggregate costs by agent, workflow, project
  - [ ] Expose getCostMetrics() method
  - [ ] Integrate with Cost-Quality Optimizer (Story 1.13)
  - [ ] Add cost logging to execution logs

- [ ] Task 10: Write unit tests (AC: All)
  - [ ] Test agent creation with valid config
  - [ ] Test agent creation with missing config (error case)
  - [ ] Test concurrent agent limits (queue behavior)
  - [ ] Test agent invocation and response handling
  - [ ] Test agent cleanup and resource release
  - [ ] Test cost tracking calculations
  - [ ] Mock LLMFactory and LLMClient for isolated testing
  - [ ] Achieve >80% code coverage

- [ ] Task 11: Write integration tests (AC: All)
  - [ ] Test end-to-end: create → invoke → destroy flow
  - [ ] Test multiple agents in parallel
  - [ ] Test queue processing when agents destroyed
  - [ ] Test integration with real LLMFactory instance
  - [ ] Test event emission (agent.started, agent.completed)
  - [ ] Test error recovery scenarios

## Dev Notes

### Architecture Alignment

**Component**: AgentPool (Section 2.1.2 in architecture.md)

**Key Design Patterns**:
- **Factory Pattern**: LLMFactory creates LLM clients for different providers
- **Event-Driven**: Emit agent.started and agent.completed events to event bus
- **Resource Pool Pattern**: Manage limited agent instances with queueing
- **Dependency Injection**: Inject LLMFactory and ProjectConfig via constructor

**Integration Points**:
- **LLMFactory (Story 1.3)**: Required for creating LLM clients per provider
- **ProjectConfig (Story 1.1)**: Source of agent_assignments configuration
- **Event Bus**: Emit lifecycle events for WebSocket/dashboard consumption
- **Cost-Quality Optimizer (Story 1.13)**: Consumes cost tracking metrics

### Project Structure Notes

**File Locations**:
- `backend/src/core/AgentPool.ts` - Main AgentPool class
- `backend/src/types/agent.ts` - Agent interface definitions
- `backend/src/core/LLMFactory.ts` - Dependency (from Story 1.3)
- `backend/tests/unit/AgentPool.test.ts` - Unit tests
- `backend/tests/integration/AgentPool.integration.test.ts` - Integration tests

**Configuration**:
- Agent assignments: `.bmad/project-config.yaml` → agent_assignments section
- Persona files: `bmad/bmm/agents/{name}.md` (e.g., `mary.md`, `winston.md`)
- Max concurrent agents: ProjectConfig → settings.max_concurrent_agents (default: 3)

### Technical Constraints

**Performance Requirements** (NFR-PERF-004):
- Agent cleanup must release resources within 30 seconds
- Memory usage: <512MB per project
- Support 3 concurrent agents per project (default)

**Concurrency**:
- Max concurrent agents configurable (default: 3)
- Queue additional agent tasks if pool at capacity
- Fair scheduling for queued tasks (FIFO)

**Cost Tracking**:
- Anthropic pricing: ~$15-30/M tokens (Sonnet), ~$1-3/M tokens (Haiku)
- OpenAI pricing: ~$10-30/M tokens (GPT-4), ~$1-2/M tokens (GPT-3.5)
- Zhipu pricing: ~$5-15/M tokens (GLM-4)
- Track input tokens, output tokens, cached tokens separately

**Error Handling**:
- LLM API failures: Handled by retry logic in LLMClient (Story 1.3)
- Agent creation failures: Clear error messages with resolution steps
- Resource exhaustion: Queue tasks or reject with informative error
- Hung agents: Auto-cleanup after configurable timeout

### Testing Strategy

**Unit Tests (60%)**:
- Mock LLMFactory and LLMClient for isolated testing
- Test agent creation, invocation, destruction independently
- Test queue behavior with mocked capacity limits
- Test cost calculations with known token counts
- Target: >80% code coverage

**Integration Tests (30%)**:
- Test with real LLMFactory instance (but mocked LLM API calls)
- Test end-to-end flow: create → invoke → destroy
- Test multiple agents in parallel
- Test event emission and state updates
- Use VCR or similar for LLM API mocking

**E2E Tests (10%)**:
- Defer to Epic 1 completion for full system E2E tests

### References

- [Source: docs/tech-spec-epic-1.md#AgentPool (Lines 86, 229-256)]
- [Source: docs/architecture.md#Section 2.1.2: Agent Pool (Lines 182-256)]
- [Source: docs/PRD.md#FR-AGENT-001: Agent Lifecycle Management (Lines 679-684)]
- [Source: docs/PRD.md#FR-AGENT-002: Agent Pool Management (Lines 686-690)]
- [Source: docs/epics.md#Story 1.4: Agent Pool & Lifecycle Management]

### Dependencies

**Prerequisites**:
- Story 1.1 (Project Structure & Configuration) - REQUIRED for ProjectConfig
- Story 1.3 (LLM Factory Pattern) - REQUIRED for LLMClient creation

**Dependents**:
- Story 1.7 (Workflow Engine) - Will use AgentPool to spawn agents
- Story 1.13 (Cost-Quality Optimizer) - Consumes cost tracking data

### Learnings from Previous Story

**Previous Story**: 1-3-llm-factory-pattern-implementation (Status: backlog)

Previous story not yet implemented. No predecessor context available.

## Dev Agent Record

### Context Reference

- [Story Context XML](./1-4-agent-pool-lifecycle-management.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

# Story 4.5: Dependency Detection & Graph Generation (Combined)

Status: in-progress

## Story

As a Scrum Master planning story implementation order,
I want the system to automatically detect dependencies between stories and generate a dependency graph with critical path analysis,
So that I can identify which stories can be worked in parallel and which must be completed sequentially.

## Acceptance Criteria

### Dependency Detection (AC 1-6)
1. **Bob Agent Invocation**: Invoke Bob agent's `detectDependencies()` method with all stories from Story 4.4
2. **Dependency Analysis**: Analyze technical dependencies (auth before protected features, data models before logic, API before frontend)
3. **Dependency Types**: Mark each dependency as hard (blocking) or soft (suggested) based on impact
4. **Dependency Edges**: Generate DependencyEdge[] array with from/to/type/blocking/reason fields
5. **Validation**: Validate all story IDs exist and are valid (no dangling references)
6. **Performance**: Complete dependency detection in <30 seconds for 20-30 stories

### Graph Generation (AC 7-14)
7. **Graph Nodes**: Build graph nodes from all stories with metadata (id, title, status, epic, complexity)
8. **Graph Edges**: Add all dependency edges to graph structure
9. **Critical Path**: Calculate critical path using topological sort (Kahn's algorithm)
10. **Bottlenecks**: Identify bottleneck stories (blocking ≥3 other stories)
11. **Parallel Groups**: Find groups of stories that can be worked in parallel (no blocking dependencies)
12. **Circular Dependencies**: Detect circular dependency chains and error if found
13. **Graph Metadata**: Calculate metadata (totalStories, parallelizable count, bottleneck list, critical path length)
14. **File Output**: Save complete graph to docs/dependency-graph.json in specified format

### Integration (AC 15-20)
15. **Type Integration**: Use DependencyEdge, DependencyGraph types from Story 4.1
16. **Bob Agent Context**: Use SolutioningAgentContextBuilder from Story 4.2 for dependency detection prompt
17. **Orchestrator Integration**: Update SolutioningOrchestrator to invoke services after story decomposition
18. **Metrics Tracking**: Add dependency detection and graph generation metrics to SolutioningResult
19. **Sprint Status Update**: Update sprint-status.yaml with graph generation timestamp
20. **Testing**: Unit tests + integration test with mock dependencies and real graph algorithms

## Tasks / Subtasks

### Task 1: Implement Dependency Detection Service (AC: 1-6)
- [ ] Create `backend/src/solutioning/dependency-detection-service.ts` file
- [ ] Implement `DependencyDetectionService` class
- [ ] Method: `detectDependencies(stories: Story[]): Promise<DependencyDetectionResult>`
  - [ ] Load SolutioningAgentContextBuilder from Story 4.2
  - [ ] Build Bob agent context with stories array
  - [ ] Generate dependency detection prompt using `bobDependencyDetectionPrompt(context, stories)`
  - [ ] Load Bob LLM config via `loadBobLLMConfig()`
  - [ ] Invoke Bob agent via LLMFactory with dependency detection prompt
  - [ ] Parse JSON response from LLM (extract from markdown code blocks)
  - [ ] Validate each DependencyEdge against schema
  - [ ] Validate story IDs exist in stories array
  - [ ] Return DependencyDetectionResult with edges and metrics
- [ ] Define DependencyDetectionResult interface:
  ```typescript
  interface DependencyDetectionResult {
    edges: DependencyEdge[];
    metrics: {
      executionTimeMs: number;
      llmTokensUsed: number;
      totalDependencies: number;
      hardDependencies: number;
      softDependencies: number;
    };
  }
  ```
- [ ] Implement retry logic (3 attempts, exponential backoff)
- [ ] Add error handling for LLM failures and validation errors
- [ ] Log metrics (execution time, token usage, dependency counts)

### Task 2: Implement Dependency Graph Generator (AC: 7-14)
- [ ] Create `backend/src/solutioning/dependency-graph-generator.ts` file
- [ ] Implement `DependencyGraphGenerator` class
- [ ] Method: `generateGraph(stories: Story[], edges: DependencyEdge[]): DependencyGraph`
  - [ ] Build graph nodes from stories (extract id, title, status, epic, complexity)
  - [ ] Add all dependency edges to graph
  - [ ] Calculate critical path using topological sort (Kahn's algorithm)
  - [ ] Identify bottlenecks (stories with ≥3 outgoing edges)
  - [ ] Find parallel groups using graph coloring/level analysis
  - [ ] Detect circular dependencies (error if found)
  - [ ] Calculate graph metadata (total stories, parallelizable, bottlenecks, critical path length)
  - [ ] Return complete DependencyGraph object
- [ ] Implement topological sort algorithm:
  - [ ] Build adjacency list from edges
  - [ ] Calculate in-degree for each node
  - [ ] Use queue-based Kahn's algorithm for topological ordering
  - [ ] Detect cycles if not all nodes processed
- [ ] Implement bottleneck detection:
  - [ ] Count outgoing edges for each node
  - [ ] Flag nodes with ≥3 outgoing edges
- [ ] Implement parallel group detection:
  - [ ] Group nodes by topological level
  - [ ] Identify nodes with no dependencies in same level
- [ ] Add comprehensive error messages for circular dependencies
- [ ] Unit test graph algorithms with known dependency structures

### Task 3: Integrate with Solutioning Orchestrator (AC: 17-19)
- [ ] Update `backend/src/solutioning/solutioning-orchestrator.ts`
- [ ] Import DependencyDetectionService and DependencyGraphGenerator
- [ ] Update executeSolutioning() method:
  - [ ] After story decomposition, invoke DependencyDetectionService
  - [ ] Pass all aggregated stories to detectDependencies()
  - [ ] Invoke DependencyGraphGenerator with stories and edges
  - [ ] Save graph to `docs/dependency-graph.json`
  - [ ] Add dependency metrics to SolutioningResult
- [ ] Update SolutioningResult interface:
  ```typescript
  interface SolutioningResult {
    epics: Epic[];
    stories: Story[];
    dependencyGraph: DependencyGraph;
    metrics: {
      // ... existing metrics
      dependencyDetectionTimeMs: number;
      graphGenerationTimeMs: number;
      totalDependencies: number;
    };
  }
  ```
- [ ] Add progress logging for dependency detection and graph generation
- [ ] Handle errors gracefully (continue without graph if detection fails)

### Task 4: Implement Bob Agent detectDependencies() Method (AC: 1-2)
- [ ] Update `backend/src/solutioning/bob-agent-factory.ts`
- [ ] Replace stub detectDependencies() implementation
- [ ] Delegate to DependencyDetectionService similar to formEpics() and decomposeIntoStories()
- [ ] Build Bob context with PRD, architecture, and stories
- [ ] Return DependencyEdge[] array from service

### Task 5: Write Unit Tests for DependencyDetectionService (AC: 20)
- [ ] Create `backend/tests/unit/solutioning/dependency-detection-service.test.ts`
- [ ] Test scenarios:
  - [ ] Successful dependency detection with mock LLM response
  - [ ] Parse JSON response from markdown code blocks
  - [ ] Validate DependencyEdge schema compliance
  - [ ] Validate story ID references exist
  - [ ] Handle LLM API failures with retry logic
  - [ ] Handle invalid JSON responses
  - [ ] Track metrics correctly (time, tokens, counts)
- [ ] Use Vitest framework with mocked LLM client
- [ ] Target: 80%+ test coverage

### Task 6: Write Unit Tests for DependencyGraphGenerator (AC: 20)
- [ ] Create `backend/tests/unit/solutioning/dependency-graph-generator.test.ts`
- [ ] Test scenarios:
  - [ ] Build graph nodes from stories correctly
  - [ ] Add dependency edges to graph
  - [ ] Calculate critical path with linear dependencies
  - [ ] Calculate critical path with complex branching
  - [ ] Identify bottlenecks (stories blocking ≥3 others)
  - [ ] Find parallel groups correctly
  - [ ] Detect circular dependencies and throw error
  - [ ] Calculate metadata accurately
  - [ ] Handle empty dependency list (all stories independent)
- [ ] Use known dependency structures for validation
- [ ] Test topological sort algorithm correctness
- [ ] Target: 80%+ test coverage

### Task 7: Write Integration Test (AC: 20)
- [ ] Create `backend/tests/integration/solutioning/dependency-graph-generation.test.ts`
- [ ] Test complete workflow:
  - [ ] Load stories from Story 4.4 (epic formation + story decomposition)
  - [ ] Invoke DependencyDetectionService with mock LLM
  - [ ] Invoke DependencyGraphGenerator with detected dependencies
  - [ ] Validate graph structure (nodes, edges, critical path, bottlenecks)
  - [ ] Verify graph saved to docs/dependency-graph.json
  - [ ] Validate circular dependency detection
- [ ] Mock only LLM API calls (use real graph algorithms)
- [ ] Test with realistic story and dependency data

### Task 8: Export and Documentation
- [ ] Export DependencyDetectionService from `backend/src/solutioning/index.ts`
- [ ] Export DependencyGraphGenerator from `backend/src/solutioning/index.ts`
- [ ] Add JSDoc comments to all public methods
- [ ] Document graph algorithm complexity (O(V+E) for topological sort)
- [ ] Add usage examples in JSDoc

## Dependencies

**Blocking Dependencies:**
- Story 4.1 complete: Solutioning Data Models & Story Schema (DependencyEdge, DependencyGraph types)
- Story 4.2 complete: Bob Agent Infrastructure & Context Builder (bobDependencyDetectionPrompt)
- Story 4.4 complete: Epic Formation & Story Decomposition (stories to analyze)

**Enables:**
- Story 4.6: Story Validation & Quality Check (validates stories before graph generation)
- Story 4.7: Sprint Status File Generation (uses dependency graph metadata)
- Story 4.8: Story File Writer (can include dependency information)

**Soft Dependencies:**
- None

## Dev Notes

### Architecture Context

This story implements dependency detection and graph generation for Epic 4: automated solutioning. It analyzes story relationships to enable parallel work planning and implementation sequencing.

**Dependency Detection Flow:**
1. Load all stories from Story 4.4 (epic formation + story decomposition)
2. Build Bob agent context with PRD, architecture, and stories
3. Invoke Bob agent to analyze technical dependencies
4. Parse dependency edges from LLM response
5. Validate all story IDs and dependency types
6. Return DependencyEdge[] array with hard/soft classification

**Graph Generation Flow:**
1. Build graph nodes from stories (extract metadata)
2. Add dependency edges to graph structure
3. Calculate critical path using topological sort (Kahn's algorithm)
4. Identify bottleneck stories (blocking ≥3 others)
5. Find parallel groups (stories with no blocking dependencies at same level)
6. Detect circular dependencies (error if found)
7. Save graph to docs/dependency-graph.json

**Topological Sort (Kahn's Algorithm):**
```
1. Build adjacency list from edges
2. Calculate in-degree for each node
3. Add all nodes with in-degree 0 to queue
4. While queue not empty:
   a. Dequeue node and add to result
   b. For each neighbor of node:
      - Decrement neighbor's in-degree
      - If in-degree becomes 0, enqueue neighbor
5. If result length < total nodes, cycle detected
6. Return result as critical path
```

**Performance Requirements:**
- Dependency detection: <30 seconds for 20-30 stories
- Graph generation: <3 seconds for 30 stories with 50 dependencies
- Memory usage: <500MB for graph operations

### Integration with Story 4.2 & 4.4

This story uses:
- **Story 4.2**: Bob agent infrastructure, context builder, dependency detection prompt template
- **Story 4.4**: Stories generated by epic formation and story decomposition

The `bobDependencyDetectionPrompt()` method from Story 4.2 already provides the prompt template for dependency detection. This story implements the actual LLM invocation and response parsing.

### Testing Strategy

**Unit Test Coverage:**
- DependencyDetectionService with mock LLM responses
- DependencyGraphGenerator with known dependency structures
- Topological sort algorithm correctness
- Circular dependency detection
- Bottleneck identification
- Parallel group detection

**Integration Test Coverage:**
- Complete workflow: stories → dependency detection → graph generation
- Graph file output validation
- Realistic story and dependency data

**Test Data:**
- Mock stories from Story 4.4 integration test
- Known dependency structures for algorithm validation
- Circular dependency test cases

**Coverage Target:**
- 80%+ statement coverage for all new code

### References

- **Epic 4 Tech Spec**: `docs/epics/epic-4-tech-spec.md` (AC-5, lines 651-669)
- **Story 4.5 Internal Sequence**: Epic spec lines 414-433
- **Dependency Detection Prompt**: `backend/src/solutioning/context-builder.ts` (lines 593-705)
- **Data Models**: `backend/src/solutioning/types.ts` (DependencyEdge, DependencyGraph interfaces)
- **Story 4.1**: Solutioning Data Models & Story Schema
- **Story 4.2**: Bob Agent Infrastructure & Context Builder
- **Story 4.4**: Epic Formation & Story Decomposition (provides stories)

## Change Log

- **2025-11-13**: Story created from Epic 4 tech spec

## Dev Agent Record

### Implementation Summary

**Status**: In Progress

Implementation started 2025-11-13.

### Context Reference

- `docs/stories/4-5-dependency-detection-graph-generation-combined.context.xml` (to be generated)

---

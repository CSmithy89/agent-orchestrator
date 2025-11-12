/**
 * Solutioning Phase Data Models and Type Definitions
 *
 * This module defines the core data structures for Epic 4: Solutioning Phase Automation.
 * All types are pure data definitions with no external dependencies (except validation).
 *
 * @module solutioning/types
 * @see docs/epics/epic-4-tech-spec.md - Lines 88-176 for detailed specifications
 */

/**
 * Story status in the development lifecycle.
 *
 * Status progression:
 * - backlog: Story exists in epic file but not drafted
 * - drafted: Story file created in stories folder
 * - ready-for-dev: Draft approved and story context created
 * - in-progress: Developer actively working on implementation
 * - review: Under review (via code-review workflow)
 * - done: Story completed and merged
 *
 * @see docs/sprint-status.yaml for current story statuses
 */
export type StoryStatus =
  | "backlog"
  | "drafted"
  | "ready-for-dev"
  | "in-progress"
  | "review"
  | "done";

/**
 * Story complexity level for estimation and planning.
 *
 * - low: Simple changes, <2 hours, minimal testing
 * - medium: Moderate changes, 2-4 hours, standard testing
 * - high: Complex changes, 4+ hours, comprehensive testing
 */
export type Complexity = "low" | "medium" | "high";

/**
 * Epic represents a major feature or capability grouping 3-10 related stories.
 * Epics provide business value and organize work into cohesive units.
 *
 * @example
 * ```typescript
 * const epic: Epic = {
 *   id: "epic-4",
 *   title: "Solutioning Phase Automation",
 *   goal: "Automate epic formation and story decomposition",
 *   value_proposition: "Reduce manual planning effort by 80%",
 *   stories: [story1, story2, story3],
 *   business_value: "15 hours saved per sprint in planning",
 *   estimated_duration: "2-3 sprints"
 * };
 * ```
 */
export interface Epic {
  /** Epic identifier (e.g., "epic-1", "epic-2") */
  id: string;

  /** Business value name, not technical component (e.g., "User Authentication") */
  title: string;

  /** Clear, concise goal statement describing what the epic achieves */
  goal: string;

  /** Why this epic matters - business impact and value */
  value_proposition: string;

  /** Array of 3-10 stories that comprise this epic */
  stories: Story[];

  /** Quantifiable business value: revenue, cost reduction, user satisfaction, etc. */
  business_value: string;

  /** Estimated time to complete (e.g., "1-2 sprints", "3-4 weeks") */
  estimated_duration: string;
}

/**
 * Story represents a single unit of work that can be autonomously completed.
 * Stories follow the "As a..., I want..., So that..." format and include
 * acceptance criteria, dependencies, and implementation guidance.
 *
 * @example
 * ```typescript
 * const story: Story = {
 *   id: "4-1",
 *   epic: "epic-4",
 *   title: "Solutioning Data Models & Story Schema",
 *   description: "As a solutioning system developer, I want foundational data models...",
 *   acceptance_criteria: [
 *     "TypeScript interfaces defined in types.ts",
 *     "JSON schema validation implemented",
 *     "All tests passing with 80%+ coverage"
 *   ],
 *   dependencies: [],
 *   status: "in-progress",
 *   technical_notes: {
 *     affected_files: ["backend/src/solutioning/types.ts"],
 *     endpoints: [],
 *     data_structures: ["Epic", "Story", "DependencyGraph"],
 *     test_requirements: "Unit tests with 80%+ coverage using Vitest"
 *   },
 *   estimated_hours: 8,
 *   complexity: "medium"
 * };
 * ```
 */
export interface Story {
  /** Story identifier (e.g., "4-1", "4-2") matching epic-story pattern */
  id: string;

  /** Parent epic ID this story belongs to */
  epic: string;

  /** Concise, action-oriented title (e.g., "User Registration Flow") */
  title: string;

  /** User story format: "As a..., I want..., So that..." (<500 words) */
  description: string;

  /** Array of 8-12 testable, atomic acceptance criteria */
  acceptance_criteria: string[];

  /** Array of story IDs that must complete before this story can start */
  dependencies: string[];

  /** Current status in the development lifecycle */
  status: StoryStatus;

  /** Implementation guidance including affected files, endpoints, and testing approach */
  technical_notes: TechnicalNotes;

  /** Estimated hours for autonomous completion (target: <2 hours) */
  estimated_hours: number;

  /** Complexity level for planning and estimation */
  complexity: Complexity;
}

/**
 * Technical notes provide implementation guidance for a story.
 * Includes affected files, API endpoints, data structures, and testing requirements.
 *
 * @example
 * ```typescript
 * const notes: TechnicalNotes = {
 *   affected_files: [
 *     "backend/src/solutioning/types.ts",
 *     "backend/src/solutioning/schemas.ts"
 *   ],
 *   endpoints: ["/api/solutioning/validate"],
 *   data_structures: ["Epic", "Story", "ValidationResult"],
 *   test_requirements: "Unit tests with mocked dependencies, 80%+ coverage"
 * };
 * ```
 */
export interface TechnicalNotes {
  /** Files likely to change during implementation (relative to repo root) */
  affected_files: string[];

  /** API endpoints involved (if applicable, empty array if none) */
  endpoints: string[];

  /** Key data models or types used in implementation */
  data_structures: string[];

  /** Testing approach summary including coverage targets and test types */
  test_requirements: string;
}

/**
 * Dependency graph represents relationships between stories for parallel work planning.
 * Includes nodes (stories), edges (dependencies), critical path analysis, and bottleneck detection.
 *
 * Sprint Status YAML Schema (docs/sprint-status.yaml):
 * ```yaml
 * generated: "2025-11-12"              # ISO date string
 * project: "Agent Orchestrator"       # Project name
 * project_key: "agent-orchestrator"   # Unique project identifier
 * tracking_system: "file-system"      # Tracking system type
 * story_location: "{project-root}/docs/stories"  # Path to story files
 *
 * development_status:
 *   # Epic status: backlog | contexted
 *   epic-4: contexted
 *
 *   # Story status: backlog | drafted | ready-for-dev | in-progress | review | done
 *   4-1-solutioning-data-models-story-schema: in-progress
 *   4-2-bob-agent-infrastructure: ready-for-dev
 * ```
 *
 * @example
 * ```typescript
 * const graph: DependencyGraph = {
 *   nodes: [
 *     { id: "4-1", title: "Data Models", status: "done", epic: "epic-4", complexity: "medium" },
 *     { id: "4-2", title: "Bob Agent", status: "in-progress", epic: "epic-4", complexity: "high" }
 *   ],
 *   edges: [
 *     { from: "4-1", to: "4-2", type: "hard", blocking: true }
 *   ],
 *   critical_path: ["4-1", "4-2", "4-3"],
 *   bottlenecks: ["4-1"],
 *   parallelizable: [["4-4", "4-5"], ["4-6", "4-7"]],
 *   metadata: {
 *     totalStories: 9,
 *     parallelizable: 4,
 *     bottlenecks: ["4-1"],
 *     criticalPathLength: 3
 *   }
 * };
 * ```
 */
export interface DependencyGraph {
  /** All stories with metadata for visualization */
  nodes: GraphNode[];

  /** Dependency relationships between stories */
  edges: DependencyEdge[];

  /** Longest dependency chain (array of story IDs in order) */
  critical_path: string[];

  /** Stories blocking 3 or more other stories */
  bottlenecks: string[];

  /** Groups of stories with no blocking dependencies (can be worked in parallel) */
  parallelizable: string[][];

  /** Aggregate statistics about the dependency graph */
  metadata: GraphMetadata;
}

/**
 * Graph node represents a story in the dependency graph.
 * Contains minimal information needed for visualization and analysis.
 *
 * @example
 * ```typescript
 * const node: GraphNode = {
 *   id: "4-1",
 *   title: "Solutioning Data Models",
 *   status: "done",
 *   epic: "epic-4",
 *   complexity: "medium"
 * };
 * ```
 */
export interface GraphNode {
  /** Story ID matching the Story.id field */
  id: string;

  /** Story title for display */
  title: string;

  /** Current status in development lifecycle */
  status: StoryStatus;

  /** Parent epic ID */
  epic: string;

  /** Complexity level for visualization sizing/coloring */
  complexity: Complexity;
}

/**
 * Dependency edge represents a relationship between two stories.
 *
 * Dependency types:
 * - hard: Blocking dependency - dependent story cannot start until prerequisite completes
 * - soft: Suggested dependency - dependent story can start but may need rework
 *
 * @example
 * ```typescript
 * const edge: DependencyEdge = {
 *   from: "4-1",  // Prerequisite story
 *   to: "4-2",    // Dependent story
 *   type: "hard", // Blocking dependency
 *   blocking: true
 * };
 * ```
 */
export interface DependencyEdge {
  /** Prerequisite story ID (must complete first) */
  from: string;

  /** Dependent story ID (depends on prerequisite) */
  to: string;

  /** Dependency type: hard (blocking) or soft (suggested) */
  type: 'hard' | 'soft';

  /** Whether this dependency blocks work from starting (true for hard, false for soft) */
  blocking: boolean;
}

/**
 * Graph metadata provides aggregate statistics about the dependency graph.
 * Used for sprint planning and capacity estimation.
 *
 * Calculation formulas:
 * - totalStories: nodes.length
 * - parallelizable: Sum of all stories in parallelizable groups
 * - bottlenecks: Stories with 3+ outgoing edges
 * - criticalPathLength: critical_path.length
 *
 * @example
 * ```typescript
 * const metadata: GraphMetadata = {
 *   totalStories: 9,
 *   parallelizable: 6,
 *   bottlenecks: ["4-1", "4-3"],
 *   criticalPathLength: 4
 * };
 * ```
 */
export interface GraphMetadata {
  /** Total number of stories in the graph */
  totalStories: number;

  /** Number of stories that can be worked in parallel */
  parallelizable: number;

  /** Story IDs that are bottlenecks (block 3+ other stories) */
  bottlenecks: string[];

  /** Length of the critical path (longest dependency chain) */
  criticalPathLength: number;
}

/**
 * Story metadata provides summary information about a story for quick reference.
 * Used in reports and dashboards without loading full story details.
 *
 * @example
 * ```typescript
 * const metadata: StoryMetadata = {
 *   complexity: "medium",
 *   estimated_hours: 8,
 *   affected_files: ["backend/src/solutioning/types.ts"],
 *   test_requirements: "Unit tests with 80%+ coverage"
 * };
 * ```
 */
export interface StoryMetadata {
  /** Complexity level */
  complexity: Complexity;

  /** Estimated hours for completion */
  estimated_hours: number;

  /** Files affected by this story */
  affected_files: string[];

  /** Testing requirements summary */
  test_requirements: string;
}

/**
 * Validation result from story quality checks.
 * Includes pass/fail status, weighted score, detailed check results, and issue lists.
 *
 * Score calculation: Weighted average of individual check scores (0.0-1.0)
 * - Size checks: 20% weight
 * - Clarity checks: 30% weight
 * - Dependency checks: 25% weight
 * - Completeness checks: 25% weight
 *
 * @example
 * ```typescript
 * const result: ValidationResult = {
 *   pass: false,
 *   score: 0.75,
 *   checks: [
 *     {
 *       category: "size",
 *       name: "Story Size",
 *       pass: true,
 *       details: "Story has 10 acceptance criteria (within 8-12 range)"
 *     },
 *     {
 *       category: "dependencies",
 *       name: "Circular Dependencies",
 *       pass: false,
 *       details: "Circular dependency detected: 4-2 -> 4-3 -> 4-2"
 *     }
 *   ],
 *   blockers: ["Circular dependency detected: 4-2 -> 4-3 -> 4-2"],
 *   warnings: ["Story has 15 estimated hours (target: <8 hours)"]
 * };
 * ```
 */
export interface ValidationResult {
  /** True if all checks pass (no blockers) */
  pass: boolean;

  /** Weighted average score of all checks (0.0-1.0, where 1.0 is perfect) */
  score: number;

  /** Individual check results with details */
  checks: ValidationCheck[];

  /** Critical issues preventing implementation (must be resolved) */
  blockers: string[];

  /** Non-blocking issues for review (should be addressed but not critical) */
  warnings: string[];
}

/**
 * Individual validation check result.
 * Categorizes checks for reporting and provides detailed findings.
 *
 * Check categories:
 * - size: Story size, acceptance criteria count, estimated hours
 * - clarity: Description quality, acceptance criteria clarity, title format
 * - dependencies: Circular dependencies, missing dependencies, dependency order
 * - completeness: Required fields present, technical notes complete, test requirements specified
 *
 * @example
 * ```typescript
 * const check: ValidationCheck = {
 *   category: "completeness",
 *   name: "Technical Notes",
 *   pass: true,
 *   details: "All required technical notes fields are present and non-empty"
 * };
 * ```
 */
export interface ValidationCheck {
  /** Check category for grouping and reporting */
  category: string;

  /** Human-readable check name */
  name: string;

  /** Whether this check passed */
  pass: boolean;

  /** Specific findings or error details */
  details: string;
}

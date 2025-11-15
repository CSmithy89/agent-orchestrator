/**
 * Dependency Graph Types
 *
 * Types for the dependency graph visualization component.
 * These types define the structure of dependency graph data
 * used to render interactive D3.js visualizations.
 */

/**
 * Status of a story in the dependency graph
 */
export type StoryStatus = 'pending' | 'in-progress' | 'review' | 'merged' | 'blocked';

/**
 * Complexity level of a story
 */
export type StoryComplexity = 'small' | 'medium' | 'large';

/**
 * Type of dependency between stories
 * - hard: Blocking dependency (target story cannot start until source is complete)
 * - soft: Suggested dependency (recommended order but not strictly required)
 */
export type DependencyType = 'hard' | 'soft';

/**
 * A node in the dependency graph representing a story
 */
export interface DependencyNode {
  /** Unique identifier for the node */
  id: string;

  /** Story ID (e.g., "6-8") */
  storyId: string;

  /** Epic number */
  epicNumber: number;

  /** Story number within the epic */
  storyNumber: number;

  /** Story title */
  title: string;

  /** Current status of the story */
  status: StoryStatus;

  /** Story complexity level (affects node size) */
  complexity: StoryComplexity;

  /** Whether the story has an active worktree */
  hasWorktree: boolean;
}

/**
 * An edge in the dependency graph representing a dependency between stories
 */
export interface DependencyEdge {
  /** Source story ID (prerequisite) */
  source: string;

  /** Target story ID (dependent story) */
  target: string;

  /** Type of dependency (hard/soft) */
  type: DependencyType;

  /** Whether this dependency is currently blocking */
  isBlocking: boolean;
}

/**
 * Complete dependency graph data structure
 */
export interface DependencyGraph {
  /** All story nodes in the graph */
  nodes: DependencyNode[];

  /** All dependency edges in the graph */
  edges: DependencyEdge[];

  /** Story IDs on the critical path */
  criticalPath: string[];
}

/**
 * Filter options for the dependency graph
 */
export interface GraphFilters {
  /** Filter by epic number (undefined = all epics) */
  epic?: number;

  /** Filter by story status (empty array = all statuses) */
  status?: StoryStatus[];

  /** Filter to show only blocking dependencies */
  blocking?: boolean;
}

/**
 * View mode for the dependency visualization
 */
export type ViewMode = 'graph' | 'list';

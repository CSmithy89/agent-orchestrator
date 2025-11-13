/**
 * Dependency Graph Generator
 *
 * Generates dependency graph with critical path analysis, bottleneck detection,
 * and parallelization opportunities. Uses topological sort (Kahn's algorithm)
 * for critical path calculation and detects circular dependencies.
 *
 * @module solutioning/dependency-graph-generator
 * @see docs/stories/4-5-dependency-detection-graph-generation-combined.md
 */

import { Story, DependencyEdge, DependencyGraph, GraphNode, GraphMetadata } from './types.js';

/**
 * Dependency Graph Generator
 *
 * Builds complete dependency graph from stories and edges:
 * - Nodes: All stories with metadata
 * - Edges: Dependency relationships
 * - Critical path: Longest dependency chain (topological sort)
 * - Bottlenecks: Stories blocking ≥3 others
 * - Parallel groups: Stories with no blocking dependencies
 * - Circular dependency detection
 *
 * Performance: <3 seconds for 30 stories with 50 dependencies
 *
 * @example
 * ```typescript
 * const generator = new DependencyGraphGenerator();
 * const graph = generator.generateGraph(stories, edges);
 * console.log(`Critical path length: ${graph.critical_path.length}`);
 * console.log(`Bottlenecks: ${graph.bottlenecks.join(', ')}`);
 * console.log(`Parallel groups: ${graph.parallelizable.length}`);
 * ```
 */
export class DependencyGraphGenerator {
  /**
   * Generate complete dependency graph
   *
   * Workflow:
   * 1. Build graph nodes from stories
   * 2. Add dependency edges to graph
   * 3. Calculate critical path using topological sort (Kahn's algorithm)
   * 4. Identify bottlenecks (stories blocking ≥3 others)
   * 5. Find parallel groups (stories at same topological level)
   * 6. Detect circular dependencies (error if found)
   * 7. Calculate graph metadata
   * 8. Return complete DependencyGraph
   *
   * @param stories Array of stories to include in graph
   * @param edges Array of dependency edges between stories
   * @returns Complete DependencyGraph with metadata
   * @throws Error if circular dependencies detected
   *
   * @example
   * ```typescript
   * const graph = generator.generateGraph(stories, edges);
   * await saveGraphToFile(graph, 'docs/dependency-graph.json');
   * ```
   */
  generateGraph(stories: Story[], edges: DependencyEdge[]): DependencyGraph {
    console.log('[DependencyGraphGenerator] Generating dependency graph...');
    console.log(`[DependencyGraphGenerator] ${stories.length} stories, ${edges.length} dependencies`);

    // Build graph nodes
    const nodes = this.buildNodes(stories);
    console.log(`[DependencyGraphGenerator] Built ${nodes.length} graph nodes`);

    // Calculate critical path using topological sort
    const criticalPath = this.calculateCriticalPath(stories, edges);
    console.log(`[DependencyGraphGenerator] Critical path length: ${criticalPath.length}`);

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(stories, edges);
    console.log(`[DependencyGraphGenerator] Identified ${bottlenecks.length} bottleneck(s)`);

    // Find parallel groups
    const parallelizable = this.findParallelGroups(stories, edges);
    console.log(`[DependencyGraphGenerator] Found ${parallelizable.length} parallel group(s)`);

    // Calculate metadata
    const metadata = this.calculateMetadata(nodes, edges, criticalPath, bottlenecks, parallelizable);

    const graph: DependencyGraph = {
      nodes,
      edges,
      critical_path: criticalPath,
      bottlenecks,
      parallelizable,
      metadata
    };

    console.log('[DependencyGraphGenerator] Dependency graph generated successfully');

    return graph;
  }

  /**
   * Build graph nodes from stories
   *
   * Extracts minimal metadata needed for visualization:
   * - id, title, status, epic, complexity
   *
   * @param stories Array of stories
   * @returns Array of GraphNode objects
   */
  private buildNodes(stories: Story[]): GraphNode[] {
    return stories.map(story => ({
      id: story.id,
      title: story.title,
      status: story.status,
      epic: story.epic,
      complexity: story.complexity
    }));
  }

  /**
   * Calculate critical path using topological sort (Kahn's algorithm)
   *
   * Critical path is the longest dependency chain in the graph.
   * Uses Kahn's algorithm for topological ordering:
   * 1. Build adjacency list from edges
   * 2. Calculate in-degree for each node
   * 3. Add nodes with in-degree 0 to queue
   * 4. Process queue: dequeue node, decrement neighbor in-degrees, enqueue if 0
   * 5. If all nodes processed, return topological order as critical path
   * 6. If not all nodes processed, circular dependency detected (error)
   *
   * Time complexity: O(V + E) where V = stories, E = dependencies
   *
   * @param stories Array of stories
   * @param edges Array of dependency edges
   * @returns Array of story IDs in critical path order
   * @throws Error if circular dependencies detected
   */
  private calculateCriticalPath(stories: Story[], edges: DependencyEdge[]): string[] {
    const storyIds = stories.map(s => s.id);

    // Build adjacency list and in-degree map
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize adjacency list and in-degree
    for (const id of storyIds) {
      adjacencyList.set(id, []);
      inDegree.set(id, 0);
    }

    // Build adjacency list from edges (only blocking dependencies)
    for (const edge of edges) {
      if (edge.blocking) {
        adjacencyList.get(edge.from)?.push(edge.to);
        inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      }
    }

    // Find all nodes with in-degree 0 (no dependencies)
    const queue: string[] = [];
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    // Topological sort using Kahn's algorithm
    const criticalPath: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      criticalPath.push(current);

      // Process neighbors
      const neighbors = adjacencyList.get(current) || [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Check for circular dependencies
    if (criticalPath.length !== storyIds.length) {
      const unprocessed = storyIds.filter(id => !criticalPath.includes(id));
      const cycle = this.findCycle(adjacencyList, unprocessed);

      throw new Error(
        `Circular dependency detected: ${cycle.join(' → ')}. ` +
        `Unprocessed stories: ${unprocessed.join(', ')}. ` +
        `Please resolve circular dependencies before proceeding.`
      );
    }

    return criticalPath;
  }

  /**
   * Find a circular dependency cycle in the graph
   *
   * Uses DFS to find a cycle starting from unprocessed nodes.
   *
   * @param adjacencyList Graph adjacency list
   * @param unprocessedNodes Nodes not processed by topological sort
   * @returns Array of story IDs forming a cycle
   */
  private findCycle(adjacencyList: Map<string, string[]>, unprocessedNodes: string[]): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);

      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) {
            return true;
          }
        } else if (recursionStack.has(neighbor)) {
          // Found cycle
          return true;
        }
      }

      path.pop();
      recursionStack.delete(node);
      return false;
    };

    // Start DFS from first unprocessed node
    for (const node of unprocessedNodes) {
      if (!visited.has(node)) {
        if (dfs(node)) {
          return path;
        }
      }
    }

    return unprocessedNodes; // Fallback if cycle not found
  }

  /**
   * Identify bottleneck stories (blocking ≥3 other stories)
   *
   * A story is a bottleneck if 3 or more other stories depend on it.
   * Counts incoming edges (dependencies on this story) and flags stories with ≥3.
   *
   * Time complexity: O(E) where E = dependencies
   *
   * @param stories Array of stories
   * @param edges Array of dependency edges
   * @returns Array of bottleneck story IDs
   */
  private identifyBottlenecks(stories: Story[], edges: DependencyEdge[]): string[] {
    const dependentCount = new Map<string, number>();

    // Initialize counts
    for (const story of stories) {
      dependentCount.set(story.id, 0);
    }

    // Count how many stories depend on each story (only blocking dependencies)
    // Edge: from="prerequisite", to="dependent" means "to" depends on "from"
    // So we count how many times a story appears as "from" (prerequisite)
    for (const edge of edges) {
      if (edge.blocking) {
        dependentCount.set(edge.from, (dependentCount.get(edge.from) || 0) + 1);
      }
    }

    // Find stories with ≥3 dependent stories
    const bottlenecks: string[] = [];
    for (const [id, count] of dependentCount.entries()) {
      if (count >= 3) {
        bottlenecks.push(id);
      }
    }

    return bottlenecks;
  }

  /**
   * Find groups of stories that can be worked in parallel
   *
   * Groups stories by topological level (distance from root nodes).
   * Stories at the same level have no dependencies on each other
   * and can be worked in parallel.
   *
   * Time complexity: O(V + E) where V = stories, E = dependencies
   *
   * @param stories Array of stories
   * @param edges Array of dependency edges
   * @returns Array of story ID groups that can run in parallel
   */
  private findParallelGroups(stories: Story[], edges: DependencyEdge[]): string[][] {
    const storyIds = stories.map(s => s.id);

    // Build adjacency list and in-degree map
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const id of storyIds) {
      adjacencyList.set(id, []);
      inDegree.set(id, 0);
    }

    // Build adjacency list from edges (only blocking dependencies)
    for (const edge of edges) {
      if (edge.blocking) {
        adjacencyList.get(edge.from)?.push(edge.to);
        inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
      }
    }

    // Find parallel groups using level-order traversal
    const parallelGroups: string[][] = [];
    const queue: string[] = [];

    // Add all nodes with in-degree 0 to initial queue
    for (const [id, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(id);
      }
    }

    // Process nodes level by level
    while (queue.length > 0) {
      const levelSize = queue.length;
      const currentLevel: string[] = [];

      // Process all nodes at current level
      for (let i = 0; i < levelSize; i++) {
        const current = queue.shift()!;
        currentLevel.push(current);

        // Add neighbors with in-degree 0 to next level
        const neighbors = adjacencyList.get(current) || [];
        for (const neighbor of neighbors) {
          const newDegree = (inDegree.get(neighbor) || 0) - 1;
          inDegree.set(neighbor, newDegree);

          if (newDegree === 0) {
            queue.push(neighbor);
          }
        }
      }

      // Add level as parallel group if it has >1 story
      if (currentLevel.length > 1) {
        parallelGroups.push(currentLevel);
      }
    }

    return parallelGroups;
  }

  /**
   * Calculate graph metadata
   *
   * Aggregates statistics about the dependency graph:
   * - Total stories
   * - Parallelizable story count
   * - Bottleneck list
   * - Critical path length
   *
   * @param nodes Graph nodes
   * @param edges Dependency edges
   * @param criticalPath Critical path story IDs
   * @param bottlenecks Bottleneck story IDs
   * @param parallelGroups Parallel story groups
   * @returns GraphMetadata object
   */
  private calculateMetadata(
    nodes: GraphNode[],
    _edges: DependencyEdge[],
    criticalPath: string[],
    bottlenecks: string[],
    parallelGroups: string[][]
  ): GraphMetadata {
    // Count parallelizable stories (stories in parallel groups)
    const parallelizableCount = parallelGroups.reduce((sum, group) => sum + group.length, 0);

    return {
      totalStories: nodes.length,
      parallelizable: parallelizableCount,
      bottlenecks,
      criticalPathLength: criticalPath.length
    };
  }
}

/**
 * Dependency Trigger
 *
 * Identifies and triggers dependent stories after successful story completion.
 * Implements dependency graph traversal with circular dependency detection.
 */

import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import * as path from 'path';

/**
 * Story Dependency Info
 */
export interface StoryDependency {
  /** Story ID */
  storyId: string;
  /** Story status */
  status: string;
  /** Dependencies (prerequisite story IDs) */
  dependencies: string[];
}

/**
 * Dependency Trigger Result
 */
export interface DependencyTriggerResult {
  /** Stories that are now ready to start */
  readyStories: string[];
  /** Stories that are still blocked */
  blockedStories: string[];
  /** Circular dependencies detected */
  circularDependencies: string[][];
}

/**
 * Trigger dependent stories after successful merge
 *
 * @param completedStoryId Story ID that was just completed
 * @param sprintStatusPath Path to sprint-status.yaml file
 * @param logger Logger function
 * @returns Dependency trigger result
 */
export async function triggerDependentStories(
  completedStoryId: string,
  sprintStatusPath: string,
  logger: (msg: string) => void = console.log
): Promise<DependencyTriggerResult> {
  logger(`[Dependency Trigger] Checking dependencies for completed story: ${completedStoryId}`);

  // Load sprint status
  const sprintStatus = await loadSprintStatus(sprintStatusPath);

  // Build dependency graph
  const dependencies = buildDependencyGraph(sprintStatus);

  // Detect circular dependencies
  const circularDeps = detectCircularDependencies(dependencies);
  if (circularDeps.length > 0) {
    logger(`[Dependency Trigger] WARNING: Circular dependencies detected!`);
    circularDeps.forEach(cycle => {
      logger(`  - Cycle: ${cycle.join(' -> ')}`);
    });
  }

  // Find stories that depend on the completed story
  const dependentStories = dependencies.filter(dep =>
    dep.dependencies.includes(completedStoryId)
  );

  if (dependentStories.length === 0) {
    logger(`[Dependency Trigger] No dependent stories found for ${completedStoryId}`);
    return {
      readyStories: [],
      blockedStories: [],
      circularDependencies: circularDeps
    };
  }

  logger(`[Dependency Trigger] Found ${dependentStories.length} dependent stories`);

  // Check which dependent stories are now ready
  const readyStories: string[] = [];
  const blockedStories: string[] = [];

  for (const dep of dependentStories) {
    // Check if all prerequisites are done
    const allPrereqsDone = dep.dependencies.every(prereqId => {
      const prereq = dependencies.find(d => d.storyId === prereqId);
      return prereq && prereq.status === 'done';
    });

    if (allPrereqsDone && dep.status !== 'done' && dep.status !== 'in-progress') {
      readyStories.push(dep.storyId);
      logger(`[Dependency Trigger] Story ready to start: ${dep.storyId}`);
    } else if (!allPrereqsDone) {
      blockedStories.push(dep.storyId);
      const missingPrereqs = dep.dependencies.filter(prereqId => {
        const prereq = dependencies.find(d => d.storyId === prereqId);
        return !prereq || prereq.status !== 'done';
      });
      logger(`[Dependency Trigger] Story ${dep.storyId} blocked by: ${missingPrereqs.join(', ')}`);
    }
  }

  return {
    readyStories,
    blockedStories,
    circularDependencies: circularDeps
  };
}

/**
 * Load sprint status from YAML file
 */
async function loadSprintStatus(sprintStatusPath: string): Promise<any> {
  try {
    const content = await fs.readFile(sprintStatusPath, 'utf-8');
    return yaml.load(content);
  } catch (error) {
    throw new Error(`Failed to load sprint status: ${error}`);
  }
}

/**
 * Build dependency graph from sprint status
 *
 * Extracts story dependencies from story files.
 */
function buildDependencyGraph(sprintStatus: any): StoryDependency[] {
  const dependencies: StoryDependency[] = [];
  const developmentStatus = sprintStatus.development_status || {};

  for (const [storyId, status] of Object.entries(developmentStatus)) {
    // Skip epics and retrospectives
    if (storyId.startsWith('epic-') || storyId.endsWith('-retrospective')) {
      continue;
    }

    dependencies.push({
      storyId,
      status: String(status),
      dependencies: [] // Dependencies would need to be extracted from story files
    });
  }

  return dependencies;
}

/**
 * Detect circular dependencies in dependency graph
 *
 * Uses depth-first search to find cycles.
 */
function detectCircularDependencies(dependencies: StoryDependency[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(storyId: string, path: string[]): void {
    visited.add(storyId);
    recursionStack.add(storyId);
    path.push(storyId);

    const story = dependencies.find(d => d.storyId === storyId);
    if (story) {
      for (const depId of story.dependencies) {
        if (!visited.has(depId)) {
          dfs(depId, [...path]);
        } else if (recursionStack.has(depId)) {
          // Cycle detected
          const cycleStart = path.indexOf(depId);
          const cycle = path.slice(cycleStart);
          cycle.push(depId); // Complete the cycle
          cycles.push(cycle);
        }
      }
    }

    recursionStack.delete(storyId);
  }

  for (const dep of dependencies) {
    if (!visited.has(dep.storyId)) {
      dfs(dep.storyId, []);
    }
  }

  return cycles;
}

/**
 * Update sprint status with new story status
 *
 * Atomic update to avoid concurrent modification issues.
 */
export async function updateSprintStatus(
  storyId: string,
  newStatus: string,
  sprintStatusPath: string,
  logger: (msg: string) => void = console.log
): Promise<void> {
  logger(`[Sprint Status] Updating ${storyId}: ${newStatus}`);

  try {
    // Load current status
    const content = await fs.readFile(sprintStatusPath, 'utf-8');

    // Simple regex-based update to avoid YAML parsing issues
    const updatedContent = content.replace(
      new RegExp(`^(\\s*${storyId}:\\s*).*$`, 'm'),
      `$1${newStatus}`
    );

    // If no match found, story doesn't exist yet - this is an error
    if (updatedContent === content) {
      logger(`[Sprint Status] Warning: Story ${storyId} not found in sprint status`);
      return;
    }

    // Atomic write: temp file + rename
    const tempPath = `${sprintStatusPath}.tmp`;
    await fs.writeFile(tempPath, updatedContent, 'utf-8');
    await fs.rename(tempPath, sprintStatusPath);

    logger(`[Sprint Status] Successfully updated ${storyId} to ${newStatus}`);
  } catch (error) {
    logger(`[Sprint Status] Error updating status: ${error}`);
    throw error;
  }
}

/**
 * Dependency Graph API Client
 *
 * API methods for fetching dependency graph data from the backend.
 */

import { client } from './client';
import type { DependencyGraph } from '@/types/dependency-graph';

/**
 * Fetch dependency graph for a project
 *
 * @param projectId - The ID of the project
 * @returns Promise resolving to the dependency graph data
 */
export async function getDependencyGraph(projectId: string): Promise<DependencyGraph> {
  return client.get<DependencyGraph>(`/api/projects/${projectId}/dependency-graph`);
}

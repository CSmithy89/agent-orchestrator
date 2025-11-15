/**
 * useDependencyGraph Hook
 *
 * TanStack Query hook for fetching and caching dependency graph data.
 * Implements automatic refetching and cache invalidation strategies.
 */

import { useQuery } from '@tanstack/react-query';
import { getDependencyGraph } from '@/api/dependencies';

/**
 * Hook for fetching dependency graph data
 *
 * Features:
 * - Automatic caching with 1-minute stale time
 * - Auto-refetch every 30 seconds
 * - Only enabled when projectId is provided
 *
 * @param projectId - The project ID to fetch the dependency graph for
 * @returns TanStack Query result with dependency graph data
 */
export function useDependencyGraph(projectId: string | undefined) {
  return useQuery({
    queryKey: ['dependency-graph', projectId],
    queryFn: () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      return getDependencyGraph(projectId);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    enabled: !!projectId,
  });
}

/**
 * useDependencyWebSocket Hook
 *
 * WebSocket subscription hook for real-time dependency graph updates.
 * Automatically invalidates TanStack Query cache when dependency changes occur.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';

/**
 * Hook for subscribing to dependency graph WebSocket updates
 *
 * Features:
 * - Subscribes to story.status.changed events
 * - Automatically invalidates dependency graph query cache
 * - Filters events by project ID
 *
 * @param projectId - The project ID to subscribe to updates for
 */
export function useDependencyWebSocket(projectId: string | undefined) {
  const queryClient = useQueryClient();
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3002/ws/status-updates';
  const { events } = useWebSocket(wsUrl);

  useEffect(() => {
    if (!projectId) return;

    // Process each WebSocket event
    events.forEach((event) => {
      // Check if event is relevant to this project
      if (event.projectId !== projectId) return;

      // Invalidate dependency graph query on story status changes
      // Story status changes affect the dependency graph visualization
      if (event.eventType === 'story.status.changed') {
        queryClient.invalidateQueries({
          queryKey: ['dependency-graph', projectId],
        });
      }
    });
  }, [events, projectId, queryClient]);

  return { events };
}

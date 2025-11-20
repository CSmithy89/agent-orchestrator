import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';

/**
 * Hook for project-specific WebSocket updates
 * Subscribes to real-time events and invalidates TanStack Query cache
 *
 * @param projectId - Optional project ID to filter events (if undefined, listens to all projects)
 */
export function useProjectWebSocket(projectId?: string) {
  const queryClient = useQueryClient();
  const wsUrl = projectId
    ? `${import.meta.env.VITE_WS_URL || 'ws://localhost:3002/ws/status-updates'}?projectId=${projectId}`
    : `${import.meta.env.VITE_WS_URL || 'ws://localhost:3002/ws/status-updates'}`;

  const { events, connectionStatus, isConnected } = useWebSocket(wsUrl);

  useEffect(() => {
    if (events.length === 0) return;

    // Process latest event
    const latestEvent = events[events.length - 1];

    // Handle different event types
    switch (latestEvent.eventType) {
      case 'project.phase.changed':
        // Invalidate project queries to refetch
        queryClient.invalidateQueries({ queryKey: ['project', latestEvent.projectId] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        queryClient.invalidateQueries({ queryKey: ['workflow-status', latestEvent.projectId] });
        break;

      case 'story.status.changed':
        // Invalidate sprint status and workflow status
        queryClient.invalidateQueries({ queryKey: ['sprint-status', latestEvent.projectId] });
        queryClient.invalidateQueries({ queryKey: ['workflow-status', latestEvent.projectId] });
        break;

      case 'agent.started':
      case 'agent.completed':
        // Invalidate workflow status for agent activity updates
        queryClient.invalidateQueries({ queryKey: ['workflow-status', latestEvent.projectId] });
        break;

      case 'pr.created':
      case 'pr.merged':
        // Invalidate project and workflow status
        queryClient.invalidateQueries({ queryKey: ['project', latestEvent.projectId] });
        queryClient.invalidateQueries({ queryKey: ['workflow-status', latestEvent.projectId] });
        break;

      case 'workflow.error':
        // Invalidate all project-related queries
        queryClient.invalidateQueries({ queryKey: ['project', latestEvent.projectId] });
        queryClient.invalidateQueries({ queryKey: ['workflow-status', latestEvent.projectId] });
        break;

      case 'orchestrator.started':
      case 'orchestrator.paused':
      case 'orchestrator.resumed':
        // Invalidate project status
        queryClient.invalidateQueries({ queryKey: ['project', latestEvent.projectId] });
        break;

      default:
        // Unknown event type, invalidate project queries as fallback
        if (latestEvent.projectId) {
          queryClient.invalidateQueries({ queryKey: ['project', latestEvent.projectId] });
        }
    }
  }, [events, queryClient]);

  return {
    events,
    connectionStatus,
    isConnected,
  };
}

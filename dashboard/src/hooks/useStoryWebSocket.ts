import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';

interface StoryStatusChangedEvent {
  eventType: 'story.status.changed';
  projectId: string;
  data: {
    storyId: string;
    status: string;
  };
  timestamp: string;
}

/**
 * Hook for real-time story updates via WebSocket
 * - Subscribes to story.status.changed events
 * - Invalidates TanStack Query cache on status changes
 * - Triggers automatic refetch for reactive UI updates
 */
export function useStoryWebSocket(projectId: string) {
  const queryClient = useQueryClient();
  const { events, connectionStatus } = useWebSocket(
    import.meta.env.VITE_WS_URL || 'ws://localhost:3002/ws/status-updates'
  );

  useEffect(() => {
    // Filter and process story status change events for this project
    const storyEvents = events.filter(
      (event): event is StoryStatusChangedEvent =>
        event.eventType === 'story.status.changed' &&
        'projectId' in event &&
        event.projectId === projectId
    );

    // Invalidate project stories query when stories change
    if (storyEvents.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['project-stories', projectId] });
    }
  }, [events, projectId, queryClient]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
  };
}

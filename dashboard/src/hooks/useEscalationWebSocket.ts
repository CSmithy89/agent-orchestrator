import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from './useWebSocket';
import { useToast } from './useToast';
import type { WebSocketEvent } from '../api/types';

/**
 * Hook for real-time escalation updates via WebSocket
 * Subscribes to escalation.created and escalation.responded events
 * Invalidates TanStack Query cache when events occur
 */
export function useEscalationWebSocket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Connect to WebSocket server
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
  const { events, connectionStatus, subscribe, clearEvents } = useWebSocket(
    `${wsUrl}/ws/status-updates`,
    {
      enabled: true,
      reconnect: true,
    }
  );

  useEffect(() => {
    // Process new events
    events.forEach((event: WebSocketEvent) => {
      if (event.eventType === 'escalation.created') {
        // Invalidate escalations queries to refetch and show new escalation
        queryClient.invalidateQueries({ queryKey: ['escalations'] });

        // Show toast notification
        toast({
          title: 'New Escalation',
          description: 'A workflow requires your attention.',
          variant: 'default',
        });
      } else if (event.eventType === 'escalation.responded') {
        // Invalidate escalations queries to update resolved status
        queryClient.invalidateQueries({ queryKey: ['escalations'] });

        // Invalidate specific escalation if we have the ID
        if (event.data && typeof event.data === 'object' && 'escalationId' in event.data) {
          queryClient.invalidateQueries({
            queryKey: ['escalation', (event.data as { escalationId: string }).escalationId],
          });
        }
      }
    });

    // Clear processed events
    if (events.length > 0) {
      clearEvents();
    }
  }, [events, queryClient, toast, clearEvents]);

  return {
    connectionStatus,
    events,
    subscribe,
  };
}

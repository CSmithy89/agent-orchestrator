/**
 * useDependencyWebSocket Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDependencyWebSocket } from './useDependencyWebSocket';
import * as useWebSocketModule from './useWebSocket';

// Mock useWebSocket
vi.mock('./useWebSocket');

describe('useDependencyWebSocket', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should invalidate query cache on story.status.changed event', () => {
    const mockEvents = [
      {
        eventType: 'story.status.changed' as const,
        projectId: 'project-1',
        data: {
          storyId: '6-8',
          oldStatus: 'in-progress',
          newStatus: 'review',
        },
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      connectionStatus: 'connected',
      isConnected: true,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      clearEvents: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket('project-1'), { wrapper });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['dependency-graph', 'project-1'],
    });
  });

  // Note: dependency.changed event type removed in RETRY #1 - only story.status.changed events trigger graph updates
  it.skip('should invalidate query cache on dependency.changed event', () => {
    // This test is skipped because dependency.changed event type doesn't exist in backend
    const mockEvents = [
      {
        eventType: 'dependency.changed' as any,
        projectId: 'project-1',
        data: {
          action: 'added',
          edge: {
            source: '6-7',
            target: '6-8',
            type: 'hard',
            isBlocking: false,
          },
        },
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      connectionStatus: 'connected',
      isConnected: true,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      clearEvents: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket('project-1'), { wrapper });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['dependency-graph', 'project-1'],
    });
  });

  it('should not invalidate query cache for other event types', () => {
    const mockEvents = [
      {
        eventType: 'project.created' as any,
        projectId: 'project-1',
        data: {},
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      connectionStatus: 'connected',
      isConnected: true,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      clearEvents: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket('project-1'), { wrapper });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('should not invalidate query cache for events from other projects', () => {
    const mockEvents = [
      {
        eventType: 'story.status.changed' as const,
        projectId: 'project-2',
        data: {
          storyId: '6-8',
          oldStatus: 'in-progress',
          newStatus: 'review',
        },
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      connectionStatus: 'connected',
      isConnected: true,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      clearEvents: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket('project-1'), { wrapper });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('should not process events when projectId is undefined', () => {
    const mockEvents = [
      {
        eventType: 'story.status.changed' as const,
        projectId: 'project-1',
        data: {
          storyId: '6-8',
          oldStatus: 'in-progress',
          newStatus: 'review',
        },
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      connectionStatus: 'connected',
      isConnected: true,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      clearEvents: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket(undefined), { wrapper });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('should handle multiple events in a single update', () => {
    const mockEvents = [
      {
        eventType: 'story.status.changed' as const,
        projectId: 'project-1',
        data: {
          storyId: '6-7',
          oldStatus: 'review',
          newStatus: 'merged',
        },
        timestamp: new Date().toISOString(),
      },
      {
        eventType: 'story.status.changed' as const,
        projectId: 'project-1',
        data: {
          storyId: '6-8',
          oldStatus: 'in-progress',
          newStatus: 'review',
        },
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      connectionStatus: 'connected',
      isConnected: true,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      clearEvents: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket('project-1'), { wrapper });

    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
  });
});

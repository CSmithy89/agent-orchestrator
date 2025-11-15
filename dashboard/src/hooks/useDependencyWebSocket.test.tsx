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
        eventType: 'story.status.changed',
        projectId: 'project-1',
        storyId: '6-8',
        oldStatus: 'in-progress',
        newStatus: 'review',
        timestamp: Date.now(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      status: 'connected',
      error: null,
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket('project-1'), { wrapper });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['dependency-graph', 'project-1'],
    });
  });

  it('should invalidate query cache on dependency.changed event', () => {
    const mockEvents = [
      {
        eventType: 'dependency.changed',
        projectId: 'project-1',
        action: 'added',
        edge: {
          source: '6-7',
          target: '6-8',
          type: 'hard',
          isBlocking: false,
        },
        timestamp: Date.now(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      status: 'connected',
      error: null,
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
        eventType: 'project.created',
        projectId: 'project-1',
        timestamp: Date.now(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      status: 'connected',
      error: null,
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket('project-1'), { wrapper });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('should not invalidate query cache for events from other projects', () => {
    const mockEvents = [
      {
        eventType: 'story.status.changed',
        projectId: 'project-2',
        storyId: '6-8',
        oldStatus: 'in-progress',
        newStatus: 'review',
        timestamp: Date.now(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      status: 'connected',
      error: null,
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket('project-1'), { wrapper });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('should not process events when projectId is undefined', () => {
    const mockEvents = [
      {
        eventType: 'story.status.changed',
        projectId: 'project-1',
        storyId: '6-8',
        oldStatus: 'in-progress',
        newStatus: 'review',
        timestamp: Date.now(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      status: 'connected',
      error: null,
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket(undefined), { wrapper });

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('should handle multiple events in a single update', () => {
    const mockEvents = [
      {
        eventType: 'story.status.changed',
        projectId: 'project-1',
        storyId: '6-7',
        oldStatus: 'review',
        newStatus: 'merged',
        timestamp: Date.now(),
      },
      {
        eventType: 'dependency.changed',
        projectId: 'project-1',
        action: 'removed',
        edge: {
          source: '6-7',
          target: '6-8',
          type: 'hard',
          isBlocking: false,
        },
        timestamp: Date.now(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      events: mockEvents,
      status: 'connected',
      error: null,
    });

    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(() => useDependencyWebSocket('project-1'), { wrapper });

    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
  });
});

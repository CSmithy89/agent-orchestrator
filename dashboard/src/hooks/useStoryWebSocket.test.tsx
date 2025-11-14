import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStoryWebSocket } from './useStoryWebSocket';
import * as useWebSocketModule from './useWebSocket';

// Mock the useWebSocket hook
vi.mock('./useWebSocket');

const mockWebSocketReturn = {
  events: [],
  connectionStatus: 'connected' as const,
  error: null,
  send: vi.fn(),
};

describe('useStoryWebSocket', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue(mockWebSocketReturn);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('subscribes to WebSocket with correct URL', () => {
    renderHook(() => useStoryWebSocket('project-1'), { wrapper });

    expect(useWebSocketModule.useWebSocket).toHaveBeenCalledWith(
      expect.stringContaining('/ws/status-updates')
    );
  });

  it('returns connection status', () => {
    const { result } = renderHook(() => useStoryWebSocket('project-1'), { wrapper });

    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.isConnected).toBe(true);
  });

  it('returns disconnected status when not connected', () => {
    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      ...mockWebSocketReturn,
      connectionStatus: 'disconnected',
    });

    const { result } = renderHook(() => useStoryWebSocket('project-1'), { wrapper });

    expect(result.current.connectionStatus).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
  });

  it('invalidates project stories query when story status change event is received', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const storyStatusChangedEvent = {
      eventType: 'story.status.changed',
      projectId: 'project-1',
      data: {
        storyId: 'story-1-1',
        status: 'review',
      },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      ...mockWebSocketReturn,
      events: [storyStatusChangedEvent],
    });

    renderHook(() => useStoryWebSocket('project-1'), { wrapper });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['project-stories', 'project-1'],
      });
    });
  });

  it('does not invalidate query for events from other projects', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const storyStatusChangedEvent = {
      eventType: 'story.status.changed',
      projectId: 'project-2', // Different project
      data: {
        storyId: 'story-2-1',
        status: 'review',
      },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      ...mockWebSocketReturn,
      events: [storyStatusChangedEvent],
    });

    renderHook(() => useStoryWebSocket('project-1'), { wrapper });

    // Wait a bit to ensure no invalidation happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('ignores non-story events', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const otherEvent = {
      eventType: 'project.phase.changed',
      projectId: 'project-1',
      data: {
        phase: 'implementation',
      },
      timestamp: new Date().toISOString(),
    };

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      ...mockWebSocketReturn,
      events: [otherEvent],
    });

    renderHook(() => useStoryWebSocket('project-1'), { wrapper });

    // Wait a bit to ensure no invalidation happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });

  it('handles multiple story status change events', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const events = [
      {
        eventType: 'story.status.changed',
        projectId: 'project-1',
        data: { storyId: 'story-1-1', status: 'review' },
        timestamp: new Date().toISOString(),
      },
      {
        eventType: 'story.status.changed',
        projectId: 'project-1',
        data: { storyId: 'story-1-2', status: 'merged' },
        timestamp: new Date().toISOString(),
      },
    ];

    vi.mocked(useWebSocketModule.useWebSocket).mockReturnValue({
      ...mockWebSocketReturn,
      events,
    });

    renderHook(() => useStoryWebSocket('project-1'), { wrapper });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['project-stories', 'project-1'],
      });
    });
  });
});

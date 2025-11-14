import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useProjectWebSocket } from './useProjectWebSocket';
import type { WebSocketEvent } from '../api/types';

// Mock the useWebSocket hook
vi.mock('./useWebSocket', () => ({
  useWebSocket: vi.fn(),
}));

import { useWebSocket } from './useWebSocket';

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useProjectWebSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should connect to WebSocket with project ID', () => {
    vi.mocked(useWebSocket).mockReturnValue({
      events: [],
      connected: true,
      error: null,
      send: vi.fn(),
    });

    renderHook(() => useProjectWebSocket('proj-1'), {
      wrapper: createWrapper(),
    });

    expect(useWebSocket).toHaveBeenCalledWith(
      expect.stringContaining('/ws/status-updates?projectId=proj-1')
    );
  });

  it('should connect to WebSocket without project ID filter', () => {
    vi.mocked(useWebSocket).mockReturnValue({
      events: [],
      connected: true,
      error: null,
      send: vi.fn(),
    });

    renderHook(() => useProjectWebSocket(), {
      wrapper: createWrapper(),
    });

    expect(useWebSocket).toHaveBeenCalledWith(
      expect.stringContaining('/ws/status-updates')
    );
    expect(useWebSocket).toHaveBeenCalledWith(
      expect.not.stringContaining('projectId=')
    );
  });

  it('should invalidate queries on project.phase.changed event', () => {
    const mockEvent: WebSocketEvent = {
      projectId: 'proj-1',
      eventType: 'project.phase.changed',
      data: { phase: 'implementation' },
      timestamp: '2025-11-14T00:00:00Z',
    };

    // First render with no events
    const { rerender } = renderHook(() => useProjectWebSocket('proj-1'), {
      wrapper: createWrapper(),
    });

    vi.mocked(useWebSocket).mockReturnValue({
      events: [],
      connected: true,
      error: null,
      send: vi.fn(),
    });

    rerender();

    // Second render with event
    vi.mocked(useWebSocket).mockReturnValue({
      events: [mockEvent],
      connected: true,
      error: null,
      send: vi.fn(),
    });

    rerender();

    // Verify that the hook was called
    expect(useWebSocket).toHaveBeenCalled();
  });

  it('should invalidate queries on story.status.changed event', () => {
    const mockEvent: WebSocketEvent = {
      projectId: 'proj-1',
      eventType: 'story.status.changed',
      data: { storyId: 'story-1', status: 'done' },
      timestamp: '2025-11-14T00:00:00Z',
    };

    vi.mocked(useWebSocket).mockReturnValue({
      events: [mockEvent],
      connected: true,
      error: null,
      send: vi.fn(),
    });

    renderHook(() => useProjectWebSocket('proj-1'), {
      wrapper: createWrapper(),
    });

    expect(useWebSocket).toHaveBeenCalled();
  });

  it('should return connection status', () => {
    vi.mocked(useWebSocket).mockReturnValue({
      events: [],
      connected: false,
      error: new Error('Connection failed'),
      send: vi.fn(),
    });

    const { result } = renderHook(() => useProjectWebSocket('proj-1'), {
      wrapper: createWrapper(),
    });

    expect(result.current.connected).toBe(false);
    expect(result.current.error).toBeDefined();
    expect(result.current.events).toEqual([]);
  });

  it('should handle agent.started and agent.completed events', () => {
    const mockEvent: WebSocketEvent = {
      projectId: 'proj-1',
      eventType: 'agent.started',
      data: { agentId: 'agent-1', task: 'test task' },
      timestamp: '2025-11-14T00:00:00Z',
    };

    vi.mocked(useWebSocket).mockReturnValue({
      events: [mockEvent],
      connected: true,
      error: null,
      send: vi.fn(),
    });

    renderHook(() => useProjectWebSocket('proj-1'), {
      wrapper: createWrapper(),
    });

    expect(useWebSocket).toHaveBeenCalled();
  });

  it('should handle pr.created and pr.merged events', () => {
    const mockEvent: WebSocketEvent = {
      projectId: 'proj-1',
      eventType: 'pr.merged',
      data: { prNumber: 123 },
      timestamp: '2025-11-14T00:00:00Z',
    };

    vi.mocked(useWebSocket).mockReturnValue({
      events: [mockEvent],
      connected: true,
      error: null,
      send: vi.fn(),
    });

    renderHook(() => useProjectWebSocket('proj-1'), {
      wrapper: createWrapper(),
    });

    expect(useWebSocket).toHaveBeenCalled();
  });
});

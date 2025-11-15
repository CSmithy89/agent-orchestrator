/**
 * useDependencyGraph Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDependencyGraph } from './useDependencyGraph';
import * as dependenciesApi from '@/api/dependencies';
import type { DependencyGraph } from '@/types/dependency-graph';

// Mock the API
vi.mock('@/api/dependencies');

describe('useDependencyGraph', () => {
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

  it('should fetch dependency graph data', async () => {
    const mockGraph: DependencyGraph = {
      nodes: [
        {
          id: '6-8',
          storyId: '6-8',
          epicNumber: 6,
          storyNumber: 8,
          title: 'Dependency Graph Visualization',
          status: 'in-progress',
          complexity: 'medium',
          hasWorktree: true,
        },
      ],
      edges: [
        {
          source: '6-7',
          target: '6-8',
          type: 'hard',
          isBlocking: false,
        },
      ],
      criticalPath: ['6-7', '6-8'],
    };

    vi.mocked(dependenciesApi.getDependencyGraph).mockResolvedValue(mockGraph);

    const { result } = renderHook(() => useDependencyGraph('project-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockGraph);
    expect(dependenciesApi.getDependencyGraph).toHaveBeenCalledWith('project-1');
  });

  it('should not fetch when projectId is undefined', () => {
    const { result } = renderHook(() => useDependencyGraph(undefined), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(result.current.fetchStatus).toBe('idle');
    expect(dependenciesApi.getDependencyGraph).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const error = new Error('API Error');
    vi.mocked(dependenciesApi.getDependencyGraph).mockRejectedValue(error);

    const { result } = renderHook(() => useDependencyGraph('project-1'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });

  it('should use correct query key', async () => {
    vi.mocked(dependenciesApi.getDependencyGraph).mockResolvedValue({
      nodes: [],
      edges: [],
      criticalPath: [],
    });

    const { result } = renderHook(() => useDependencyGraph('project-123'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.findAll({ queryKey: ['dependency-graph', 'project-123'] });

    expect(queries).toHaveLength(1);
  });

  it('should cache data with correct staleTime', async () => {
    vi.mocked(dependenciesApi.getDependencyGraph).mockResolvedValue({
      nodes: [],
      edges: [],
      criticalPath: [],
    });

    const { result } = renderHook(() => useDependencyGraph('project-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(dependenciesApi.getDependencyGraph).toHaveBeenCalledTimes(1);

    // Query should be stale after staleTime but not refetch immediately
    expect(result.current.isStale).toBe(false);
  });
});

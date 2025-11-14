import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProjectStories, useUpdateStoryStatus } from './useProjectStories';
import * as storiesApi from '../api/stories';
import type { Story } from '../types/story';

// Mock the stories API
vi.mock('../api/stories');

const mockStories: Story[] = [
  {
    id: 'story-1-1',
    projectId: 'project-1',
    epicNumber: 1,
    storyNumber: 1,
    title: 'First story',
    status: 'ready',
    epic: { number: 1, title: 'Epic 1', color: 'blue' },
  },
  {
    id: 'story-1-2',
    projectId: 'project-1',
    epicNumber: 1,
    storyNumber: 2,
    title: 'Second story',
    status: 'in-progress',
    epic: { number: 1, title: 'Epic 1', color: 'blue' },
  },
];

describe('useProjectStories', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches stories for a project', async () => {
    vi.mocked(storiesApi.getProjectStories).mockResolvedValue(mockStories);

    const { result } = renderHook(() => useProjectStories('project-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockStories);
    expect(storiesApi.getProjectStories).toHaveBeenCalledWith('project-1');
  });

  it('handles errors when fetching stories fails', async () => {
    const error = new Error('Failed to fetch stories');
    vi.mocked(storiesApi.getProjectStories).mockRejectedValue(error);

    const { result } = renderHook(() => useProjectStories('project-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('does not fetch when projectId is empty', () => {
    const { result } = renderHook(() => useProjectStories(''), { wrapper });

    expect(result.current.isPending).toBe(true);
    expect(storiesApi.getProjectStories).not.toHaveBeenCalled();
  });
});

describe('useUpdateStoryStatus', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('updates story status successfully', async () => {
    vi.mocked(storiesApi.updateStoryStatus).mockResolvedValue();

    const { result } = renderHook(() => useUpdateStoryStatus('project-1'), { wrapper });

    result.current.mutate({ storyId: 'story-1-1', status: 'review' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(storiesApi.updateStoryStatus).toHaveBeenCalledWith('project-1', 'story-1-1', 'review');
  });

  it('invalidates project stories query on success', async () => {
    vi.mocked(storiesApi.updateStoryStatus).mockResolvedValue();
    vi.mocked(storiesApi.getProjectStories).mockResolvedValue(mockStories);

    // First fetch the stories to populate the cache
    const { result: storiesResult } = renderHook(() => useProjectStories('project-1'), { wrapper });
    await waitFor(() => {
      expect(storiesResult.current.isSuccess).toBe(true);
    });

    // Now update story status
    const { result: mutationResult } = renderHook(() => useUpdateStoryStatus('project-1'), { wrapper });
    mutationResult.current.mutate({ storyId: 'story-1-1', status: 'review' });

    await waitFor(() => {
      expect(mutationResult.current.isSuccess).toBe(true);
    });

    // The query should be invalidated and refetch
    await waitFor(() => {
      expect(storiesApi.getProjectStories).toHaveBeenCalledTimes(2); // Initial fetch + refetch after mutation
    });
  });

  it('performs optimistic update', async () => {
    vi.mocked(storiesApi.updateStoryStatus).mockResolvedValue();
    vi.mocked(storiesApi.getProjectStories).mockResolvedValue(mockStories);

    // Set initial data in cache
    queryClient.setQueryData(['project-stories', 'project-1'], mockStories);

    const { result } = renderHook(() => useUpdateStoryStatus('project-1'), { wrapper });

    result.current.mutate({ storyId: 'story-1-1', status: 'review' });

    await waitFor(() => {
      // Check that optimistic update happened
      const cachedData = queryClient.getQueryData<Story[]>(['project-stories', 'project-1']);
      expect(cachedData?.[0].status).toBe('review');
    });
  });

  it('rolls back optimistic update on error', async () => {
    const error = new Error('Failed to update status');
    vi.mocked(storiesApi.updateStoryStatus).mockRejectedValue(error);

    // Set initial data in cache
    queryClient.setQueryData(['project-stories', 'project-1'], mockStories);

    const { result } = renderHook(() => useUpdateStoryStatus('project-1'), { wrapper });

    result.current.mutate({ storyId: 'story-1-1', status: 'review' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Check that rollback happened
    const cachedData = queryClient.getQueryData<Story[]>(['project-stories', 'project-1']);
    expect(cachedData?.[0].status).toBe('ready'); // Original status
  });
});

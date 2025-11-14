import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useProjects, useProject, useProjectWorkflowStatus, useProjectSprintStatus } from './useProjects';
import { projectsApi } from '../api/projects';
import type { Project, WorkflowStatus, SprintStatus } from '../api/types';

// Mock the API
vi.mock('../api/projects', () => ({
  projectsApi: {
    getProjects: vi.fn(),
    getProject: vi.fn(),
    getWorkflowStatus: vi.fn(),
    getSprintStatus: vi.fn(),
  },
}));

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

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch projects successfully', async () => {
    const mockProjects: Project[] = [
      {
        id: 'proj-1',
        name: 'Test Project',
        status: 'active',
        phase: 'implementation',
        createdAt: '2025-11-14T00:00:00Z',
        updatedAt: '2025-11-14T00:00:00Z',
      },
    ];

    vi.mocked(projectsApi.getProjects).mockResolvedValue({
      success: true,
      data: mockProjects,
      timestamp: '2025-11-14T00:00:00Z',
    });

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProjects);
    expect(projectsApi.getProjects).toHaveBeenCalledTimes(1);
  });

  it('should handle error when fetching projects fails', async () => {
    vi.mocked(projectsApi.getProjects).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch single project successfully', async () => {
    const mockProject: Project = {
      id: 'proj-1',
      name: 'Test Project',
      status: 'active',
      phase: 'implementation',
      createdAt: '2025-11-14T00:00:00Z',
      updatedAt: '2025-11-14T00:00:00Z',
    };

    vi.mocked(projectsApi.getProject).mockResolvedValue({
      success: true,
      data: mockProject,
      timestamp: '2025-11-14T00:00:00Z',
    });

    const { result } = renderHook(() => useProject('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockProject);
    expect(projectsApi.getProject).toHaveBeenCalledWith('proj-1');
  });

  it('should not fetch when project ID is empty', () => {
    const { result } = renderHook(() => useProject(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(projectsApi.getProject).not.toHaveBeenCalled();
  });
});

describe('useProjectWorkflowStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch workflow status successfully', async () => {
    const mockWorkflowStatus: WorkflowStatus = {
      projectId: 'proj-1',
      currentPhase: 'implementation',
      currentStory: 'story-1-2',
      phaseProgress: [
        { phase: 'analysis', progress: 100, completedTasks: 5, totalTasks: 5 },
        { phase: 'implementation', progress: 50, completedTasks: 2, totalTasks: 4 },
      ],
    };

    vi.mocked(projectsApi.getWorkflowStatus).mockResolvedValue({
      success: true,
      data: mockWorkflowStatus,
      timestamp: '2025-11-14T00:00:00Z',
    });

    const { result } = renderHook(() => useProjectWorkflowStatus('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockWorkflowStatus);
    expect(projectsApi.getWorkflowStatus).toHaveBeenCalledWith('proj-1');
  });

  it('should not fetch when project ID is empty', () => {
    const { result } = renderHook(() => useProjectWorkflowStatus(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(projectsApi.getWorkflowStatus).not.toHaveBeenCalled();
  });
});

describe('useProjectSprintStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch sprint status successfully', async () => {
    const mockSprintStatus: SprintStatus = {
      projectKey: 'test-project',
      currentEpic: 'epic-6',
      stories: {
        '6-1-story': 'done',
        '6-2-story': 'in-progress',
      },
      velocity: 15,
    };

    vi.mocked(projectsApi.getSprintStatus).mockResolvedValue({
      success: true,
      data: mockSprintStatus,
      timestamp: '2025-11-14T00:00:00Z',
    });

    const { result } = renderHook(() => useProjectSprintStatus('proj-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockSprintStatus);
    expect(projectsApi.getSprintStatus).toHaveBeenCalledWith('proj-1');
  });

  it('should not fetch when project ID is empty', () => {
    const { result } = renderHook(() => useProjectSprintStatus(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(projectsApi.getSprintStatus).not.toHaveBeenCalled();
  });
});

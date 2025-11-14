import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';

/**
 * Hook to fetch all projects
 * - Stale time: 5 minutes
 * - Refetch interval: 30 seconds (background refetch)
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsApi.getProjects();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Background refetch every 30 seconds
  });
}

/**
 * Hook to fetch a single project by ID
 * - Stale time: 2 minutes (more frequent for detail view)
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await projectsApi.getProject(id);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!id,
  });
}

/**
 * Hook to fetch workflow status for a project
 * - Stale time: 1 minute (frequent for active workflows)
 * - Refetch interval: 10 seconds
 */
export function useProjectWorkflowStatus(projectId: string) {
  return useQuery({
    queryKey: ['workflow-status', projectId],
    queryFn: async () => {
      const response = await projectsApi.getWorkflowStatus(projectId);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 10 * 1000, // Every 10 seconds
    enabled: !!projectId,
  });
}

/**
 * Hook to fetch sprint status for a project
 * - Stale time: 2 minutes
 */
export function useProjectSprintStatus(projectId: string) {
  return useQuery({
    queryKey: ['sprint-status', projectId],
    queryFn: async () => {
      const response = await projectsApi.getSprintStatus(projectId);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!projectId,
  });
}

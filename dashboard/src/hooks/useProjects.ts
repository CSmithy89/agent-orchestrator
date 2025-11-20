import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';

/**
 * Hook to fetch all projects
 * - Stale time: 5 minutes
 * - Updates via WebSocket (useProjectWebSocket)
 */
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsApi.getProjects();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    // No polling - WebSocket handles real-time updates
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
 * - Stale time: 1 minute
 * - Updates via WebSocket on agent/workflow events
 */
export function useProjectWorkflowStatus(projectId: string) {
  return useQuery({
    queryKey: ['workflow-status', projectId],
    queryFn: async () => {
      const response = await projectsApi.getWorkflowStatus(projectId);
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    // No polling - WebSocket handles real-time updates
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

import { baseApi } from './client';
import type {
  APIResponse,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  WorkflowStatus,
  SprintStatus,
  StoryStatus,
  StoryDetail,
} from './types';

/**
 * Project management API endpoints
 */
export const projectsApi = {
  /**
   * Get all projects
   */
  getProjects: () => baseApi.get<APIResponse<Project[]>>('/api/projects'),

  /**
   * Get a single project by ID
   */
  getProject: (id: string) => baseApi.get<APIResponse<Project>>(`/api/projects/${id}`),

  /**
   * Create a new project
   */
  createProject: (data: CreateProjectRequest) =>
    baseApi.post<APIResponse<Project>>('/api/projects', data),

  /**
   * Update a project
   */
  updateProject: (id: string, data: UpdateProjectRequest) =>
    baseApi.patch<APIResponse<Project>>(`/api/projects/${id}`, data),

  /**
   * Delete a project
   */
  deleteProject: (id: string) => baseApi.delete<APIResponse<void>>(`/api/projects/${id}`),

  /**
   * Get workflow status for a project
   */
  getWorkflowStatus: (id: string) =>
    baseApi.get<APIResponse<WorkflowStatus>>(`/api/projects/${id}/workflow-status`),

  /**
   * Get sprint status for a project
   */
  getSprintStatus: (id: string) =>
    baseApi.get<APIResponse<SprintStatus>>(`/api/projects/${id}/sprint-status`),

  /**
   * Get all stories for a project
   */
  getStories: (id: string) =>
    baseApi.get<APIResponse<StoryStatus[]>>(`/api/projects/${id}/stories`),

  /**
   * Get a single story by ID
   */
  getStory: (projectId: string, storyId: string) =>
    baseApi.get<APIResponse<StoryDetail>>(`/api/projects/${projectId}/stories/${storyId}`),
};

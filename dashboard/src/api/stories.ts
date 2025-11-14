import { baseApi } from './client';
import type { Story, UpdateStoryStatusRequest } from '../types/story';
import type { APIResponse } from './types';

/**
 * Get all stories for a project
 */
export async function getProjectStories(projectId: string): Promise<Story[]> {
  const response = await baseApi.get<APIResponse<Story[]>>(`/api/projects/${projectId}/stories`);
  return response.data;
}

/**
 * Update story status (manual mode)
 */
export async function updateStoryStatus(
  projectId: string,
  storyId: string,
  status: string
): Promise<void> {
  const request: UpdateStoryStatusRequest = { status };
  await baseApi.patch(`/api/projects/${projectId}/stories/${storyId}/status`, request);
}

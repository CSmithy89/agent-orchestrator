import { baseApi } from './client';
import type { APIResponse, OrchestratorStatus, StartOrchestratorRequest } from './types';

/**
 * Orchestrator control API endpoints
 */
export const orchestratorsApi = {
  /**
   * Get orchestrator status for a project
   */
  getStatus: (projectId: string) =>
    baseApi.get<APIResponse<OrchestratorStatus>>(
      `/api/orchestrators/${projectId}/status`
    ),

  /**
   * Start orchestrator for a project
   */
  start: (projectId: string, data?: StartOrchestratorRequest) =>
    baseApi.post<APIResponse<void>>(`/api/orchestrators/${projectId}/start`, data || {}),

  /**
   * Pause orchestrator for a project
   */
  pause: (projectId: string) =>
    baseApi.post<APIResponse<void>>(`/api/orchestrators/${projectId}/pause`, {}),

  /**
   * Resume orchestrator for a project
   */
  resume: (projectId: string) =>
    baseApi.post<APIResponse<void>>(`/api/orchestrators/${projectId}/resume`, {}),
};

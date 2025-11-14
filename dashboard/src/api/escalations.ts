import { baseApi } from './client';
import type {
  APIResponse,
  EscalationStatus,
  EscalationDetail,
  RespondToEscalationRequest,
} from './types';

/**
 * Escalation management API endpoints
 */
export const escalationsApi = {
  /**
   * Get all escalations
   */
  getEscalations: () => baseApi.get<APIResponse<EscalationStatus[]>>('/api/escalations'),

  /**
   * Get escalations for a specific project
   */
  getProjectEscalations: (projectId: string) =>
    baseApi.get<APIResponse<EscalationStatus[]>>(`/api/escalations?projectId=${projectId}`),

  /**
   * Get a single escalation by ID
   */
  getEscalation: (id: string) =>
    baseApi.get<APIResponse<EscalationDetail>>(`/api/escalations/${id}`),

  /**
   * Respond to an escalation
   */
  respondToEscalation: (id: string, data: RespondToEscalationRequest) =>
    baseApi.post<APIResponse<EscalationDetail>>(`/api/escalations/${id}/respond`, data),
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escalationsApi } from '../api/escalations';
import type { EscalationDetail } from '../api/types';

/**
 * Hook to fetch all escalations with optional status filter
 */
export function useEscalations(status?: 'pending' | 'responded' | 'resolved') {
  return useQuery({
    queryKey: ['escalations', status],
    queryFn: async () => {
      const response = await escalationsApi.getEscalations();
      const escalations = response.data;

      // Filter by status if provided
      if (status) {
        return escalations.filter(e => e.status === status);
      }

      return escalations;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch escalations for a specific project
 */
export function useProjectEscalations(projectId: string, status?: 'pending' | 'responded' | 'resolved') {
  return useQuery({
    queryKey: ['escalations', 'project', projectId, status],
    queryFn: async () => {
      const response = await escalationsApi.getProjectEscalations(projectId);
      const escalations = response.data;

      // Filter by status if provided
      if (status) {
        return escalations.filter(e => e.status === status);
      }

      return escalations;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    enabled: !!projectId,
  });
}

/**
 * Hook to fetch a single escalation by ID
 */
export function useEscalation(id: string) {
  return useQuery({
    queryKey: ['escalation', id],
    queryFn: async () => {
      const response = await escalationsApi.getEscalation(id);
      return response.data;
    },
    staleTime: 30 * 1000, // 30 seconds (fresh for detail view)
    enabled: !!id,
  });
}

/**
 * Hook to submit a response to an escalation
 */
export function useSubmitEscalationResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      response,
      decision,
      notes
    }: {
      id: string;
      response: string;
      decision?: string;
      notes?: string;
    }) => escalationsApi.respondToEscalation(id, { response, decision, notes }),

    onSuccess: (data, variables) => {
      // Invalidate escalations list queries to refetch
      queryClient.invalidateQueries({ queryKey: ['escalations'] });

      // Update the specific escalation in cache
      queryClient.setQueryData<EscalationDetail>(['escalation', variables.id], data.data);
    },
  });
}

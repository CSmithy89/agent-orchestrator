import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectStories, updateStoryStatus } from '../api/stories';
import type { Story } from '../types/story';

/**
 * Hook to fetch all stories for a project
 * - Stale time: 1 minute
 * - Refetch interval: 30 seconds
 */
export function useProjectStories(projectId: string) {
  return useQuery({
    queryKey: ['project-stories', projectId],
    queryFn: () => getProjectStories(projectId),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    enabled: !!projectId,
  });
}

/**
 * Hook to update story status (for manual drag-and-drop mode)
 * Invalidates project stories query on success for reactive UI updates
 */
export function useUpdateStoryStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, status }: { storyId: string; status: string }) =>
      updateStoryStatus(projectId, storyId, status),

    onMutate: async ({ storyId, status }) => {
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['project-stories', projectId] });

      // Snapshot previous value
      const previousStories = queryClient.getQueryData<Story[]>(['project-stories', projectId]);

      // Optimistically update to the new value
      if (previousStories) {
        queryClient.setQueryData<Story[]>(
          ['project-stories', projectId],
          previousStories.map(story =>
            story.id === storyId ? { ...story, status: status as Story['status'] } : story
          )
        );
      }

      // Return context object with snapshot value
      return { previousStories };
    },

    onError: (_err, _variables, context) => {
      // If mutation fails, use the context returned from onMutate to roll back
      if (context?.previousStories) {
        queryClient.setQueryData(['project-stories', projectId], context.previousStories);
      }
    },

    onSuccess: () => {
      // Invalidate and refetch project stories query
      queryClient.invalidateQueries({ queryKey: ['project-stories', projectId] });
    },
  });
}

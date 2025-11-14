import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { Button } from '../components/ui/button';
import { useProjectStories } from '../hooks/useProjectStories';
import { useStoryWebSocket } from '../hooks/useStoryWebSocket';
import { useProject } from '../hooks/useProjects';

/**
 * Kanban Board Page
 * - Displays stories in a Kanban board layout
 * - Integrates with WebSocket for real-time updates
 * - Shows loading and error states
 * - Provides navigation back to project detail
 */
export default function KanbanBoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const {
    data: stories,
    isLoading: isLoadingStories,
    error: storiesError,
    refetch: refetchStories,
  } = useProjectStories(projectId || '');

  const {
    data: project,
    isLoading: isLoadingProject,
  } = useProject(projectId || '');

  const { connectionStatus, isConnected } = useStoryWebSocket(projectId || '');

  const isLoading = isLoadingStories || isLoadingProject;
  const error = storiesError;

  // Handle back navigation
  const handleBackClick = () => {
    navigate(`/projects/${projectId}`);
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackClick} aria-label="Back to project">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Story Board</h1>
              {project && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{project.name}</p>
              )}
            </div>
          </div>
          <ConnectionStatus status={connectionStatus} />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <LoadingSkeleton count={3} height={120} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Stories</h3>
            </div>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {error instanceof Error ? error.message : 'Failed to load stories'}
            </p>
            <Button variant="outline" onClick={() => refetchStories()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Kanban Board */}
        {!isLoading && !error && stories && (
          <>
            {!isConnected && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  WebSocket disconnected. Real-time updates are unavailable. The board will still refresh
                  every 30 seconds.
                </p>
              </div>
            )}
            <KanbanBoard projectId={projectId || ''} stories={stories} />
          </>
        )}
    </div>
  );
}

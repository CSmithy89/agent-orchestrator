import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ExternalLink, GitBranch, CheckCircle2, Circle } from 'lucide-react';
import type { Story } from '../../types/story';

interface StoryDetailModalProps {
  story: Story | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Story detail modal component
 * - Displays full story information
 * - Shows acceptance criteria, tasks, and dependencies
 * - Links to story file and PR
 */
export function StoryDetailModal({ story, isOpen, onClose }: StoryDetailModalProps) {
  if (!story) return null;

  const hasDependencies = story.dependencies && story.dependencies.length > 0;
  const hasTasks = story.tasks && story.tasks.length > 0;
  const hasAcceptanceCriteria = story.acceptanceCriteria && story.acceptanceCriteria.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{story.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-mono">{story.id}</span>
                <Badge variant="secondary">Epic {story.epicNumber}</Badge>
                <Badge variant="outline">{story.status}</Badge>
                {story.storyPoints && (
                  <Badge variant="outline">{story.storyPoints} points</Badge>
                )}
              </DialogDescription>
            </div>
            {story.prUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={story.prUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View PR
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Description */}
          {story.description && (
            <div>
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Description
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{story.description}</p>
            </div>
          )}

          {/* Acceptance Criteria */}
          {hasAcceptanceCriteria && (
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Acceptance Criteria
              </h3>
              <ul className="space-y-2">
                {story.acceptanceCriteria!.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-400">{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tasks */}
          {hasTasks && (
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Tasks ({story.tasks!.filter((t) => t.completed).length}/{story.tasks!.length} completed)
              </h3>
              <ul className="space-y-2">
                {story.tasks!.map((task) => (
                  <li key={task.id}>
                    <div className="flex items-start gap-2 text-sm">
                      {task.completed ? (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 mt-0.5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                      )}
                      <span
                        className={
                          task.completed
                            ? 'text-gray-500 dark:text-gray-500 line-through'
                            : 'text-gray-600 dark:text-gray-400'
                        }
                      >
                        {task.description}
                      </span>
                    </div>
                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <ul className="ml-8 mt-1 space-y-1">
                        {task.subtasks.map((subtask) => (
                          <li key={subtask.id} className="flex items-start gap-2 text-xs">
                            {subtask.completed ? (
                              <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                            ) : (
                              <Circle className="h-3 w-3 mt-0.5 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                            )}
                            <span
                              className={
                                subtask.completed
                                  ? 'text-gray-500 dark:text-gray-500 line-through'
                                  : 'text-gray-600 dark:text-gray-400'
                              }
                            >
                              {subtask.description}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies */}
          {hasDependencies && (
            <div>
              <h3 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Dependencies
              </h3>
              <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <GitBranch className="h-4 w-4" />
                <span>
                  This story depends on {story.dependencies!.length} other{' '}
                  {story.dependencies!.length === 1 ? 'story' : 'stories'}:
                </span>
              </div>
              <ul className="mt-2 ml-6 space-y-1">
                {story.dependencies!.map((depId) => (
                  <li key={depId} className="text-sm font-mono text-gray-600 dark:text-gray-400">
                    {depId}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

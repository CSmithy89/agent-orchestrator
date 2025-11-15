import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { ExternalLink, GitBranch } from 'lucide-react';
import type { Story } from '../../types/story';
import { cn } from '../../lib/utils';

interface StoryCardProps {
  story: Story;
  onClick: () => void;
  isDragDisabled?: boolean;
}

/**
 * Epic color mapping for visual organization
 * Consistent color scheme across the dashboard
 */
const EPIC_COLORS: Record<number, string> = {
  1: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  2: 'border-green-500 bg-green-50 dark:bg-green-950',
  3: 'border-purple-500 bg-purple-50 dark:bg-purple-950',
  4: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  5: 'border-red-500 bg-red-50 dark:bg-red-950',
  6: 'border-pink-500 bg-pink-50 dark:bg-pink-950',
  7: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950',
  8: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
};

const EPIC_BADGE_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  2: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  3: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
  4: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  5: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  6: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100',
  7: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
  8: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
};

/**
 * Story card component for Kanban board
 * - Displays story ID, title, epic, status, PR link
 * - Shows dependency indicator
 * - Epic color-coding for visual organization
 * - Draggable for status updates
 */
export function StoryCard({ story, onClick, isDragDisabled = false }: StoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: story.id,
    disabled: isDragDisabled,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const epicColor = EPIC_COLORS[story.epicNumber] || 'border-gray-500 bg-gray-50 dark:bg-gray-950';
  const epicBadgeColor =
    EPIC_BADGE_COLORS[story.epicNumber] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';

  const hasDependencies = story.dependencies && story.dependencies.length > 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn(
          'cursor-pointer hover:shadow-md transition-shadow border-l-4',
          epicColor,
          isDragging && 'opacity-50 shadow-lg',
          'mb-3'
        )}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Story ${story.id}: ${story.title}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <CardContent className="p-4">
          {/* Story ID and PR Link */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{story.id}</span>
            {story.prUrl && (
              <a
                href={story.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                aria-label="Open pull request"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          {/* Story Title */}
          <h3 className="text-sm font-medium mb-3 line-clamp-2">{story.title}</h3>

          {/* Epic Badge and Dependency Indicator */}
          <div className="flex items-center gap-2">
            <Badge className={epicBadgeColor} variant="secondary">
              Epic {story.epicNumber}
            </Badge>

            {hasDependencies && (
              <div
                className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
                title={`Depends on ${story.dependencies!.length} other ${story.dependencies!.length === 1 ? 'story' : 'stories'}`}
                aria-label={`Has ${story.dependencies!.length} ${story.dependencies!.length === 1 ? 'dependency' : 'dependencies'}`}
              >
                <GitBranch className="h-3 w-3" />
                <span>{story.dependencies!.length}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

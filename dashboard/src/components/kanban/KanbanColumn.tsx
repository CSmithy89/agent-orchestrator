import { useDroppable } from '@dnd-kit/core';
import { StoryCard } from './StoryCard';
import type { Story } from '../../types/story';
import { cn } from '../../lib/utils';

interface KanbanColumnProps {
  status: Story['status'];
  title: string;
  stories: Story[];
  onStoryClick: (story: Story) => void;
  isDragDisabled?: boolean;
}

/**
 * Status color mapping for column headers
 */
const STATUS_COLORS: Record<Story['status'], string> = {
  backlog: 'bg-gray-100 dark:bg-gray-800',
  ready: 'bg-blue-100 dark:bg-blue-900',
  'in-progress': 'bg-yellow-100 dark:bg-yellow-900',
  review: 'bg-purple-100 dark:bg-purple-900',
  merged: 'bg-green-100 dark:bg-green-900',
  done: 'bg-emerald-100 dark:bg-emerald-900',
};

/**
 * Kanban column component
 * - Displays stories for a specific status
 * - Droppable area for drag-and-drop
 * - Shows story count
 * - Vertical scrolling for overflow
 */
export function KanbanColumn({
  status,
  title,
  stories,
  onStoryClick,
  isDragDisabled = false,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const headerColor = STATUS_COLORS[status] || 'bg-gray-100 dark:bg-gray-800';

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      {/* Column Header */}
      <div className={cn('rounded-t-lg px-4 py-3 mb-3', headerColor)}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wide">{title}</h2>
          <span
            className="bg-white dark:bg-gray-900 text-xs px-2 py-1 rounded-full font-medium"
            aria-label={`${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}
          >
            {stories.length}
          </span>
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 px-2 py-2 rounded-b-lg min-h-[200px] overflow-y-auto',
          'bg-gray-50 dark:bg-gray-900',
          isOver && 'bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-400 dark:ring-blue-600'
        )}
        role="region"
        aria-label={`${title} column with ${stories.length} ${stories.length === 1 ? 'story' : 'stories'}`}
      >
        {stories.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-sm">
            No stories
          </div>
        ) : (
          stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onClick={() => onStoryClick(story)}
              isDragDisabled={isDragDisabled}
            />
          ))
        )}
      </div>
    </div>
  );
}

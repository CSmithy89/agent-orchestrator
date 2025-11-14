import { useState, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { StoryCard } from './StoryCard';
import { StoryFilters } from './StoryFilters';
import { StoryDetailModal } from './StoryDetailModal';
import type { Story } from '../../types/story';
import { useUpdateStoryStatus } from '../../hooks/useProjectStories';
import { useToast } from '../../hooks/useToast';

interface KanbanBoardProps {
  projectId: string;
  stories: Story[];
  isDragDisabled?: boolean;
}

const COLUMNS: Array<{ status: Story['status']; title: string }> = [
  { status: 'ready', title: 'Ready' },
  { status: 'in-progress', title: 'In Progress' },
  { status: 'review', title: 'Code Review' },
  { status: 'merged', title: 'Merged' },
];

/**
 * Kanban board container component
 * - Manages drag-and-drop state
 * - Handles story filtering (epic and search)
 * - Integrates with mutation for status updates
 * - Shows story detail modal on card click
 */
export function KanbanBoard({ projectId, stories, isDragDisabled = false }: KanbanBoardProps) {
  const [epicFilter, setEpicFilter] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const updateStoryStatus = useUpdateStoryStatus(projectId);
  const { toast } = useToast();

  // Get unique epic numbers from stories
  const availableEpics = useMemo(() => {
    const epics = new Set<number>();
    stories.forEach((story) => epics.add(story.epicNumber));
    return Array.from(epics).sort((a, b) => a - b);
  }, [stories]);

  // Apply filters
  const filteredStories = useMemo(() => {
    let filtered = [...stories];

    // Filter by epic
    if (epicFilter !== null) {
      filtered = filtered.filter((story) => story.epicNumber === epicFilter);
    }

    // Filter by search term (case-insensitive)
    if (searchTerm.trim().length > 0) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((story) => story.title.toLowerCase().includes(term));
    }

    return filtered;
  }, [stories, epicFilter, searchTerm]);

  // Group stories by status
  const getStoriesForStatus = (status: Story['status']) => {
    return filteredStories.filter((story) => story.status === status);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveStory(null);

    if (!over) return;

    const storyId = active.id as string;
    const newStatus = over.id as Story['status'];

    // Find the story being dragged
    const story = stories.find((s) => s.id === storyId);
    if (!story) return;

    // Don't update if status hasn't changed
    if (story.status === newStatus) return;

    // Update story status
    updateStoryStatus.mutate(
      { storyId, status: newStatus },
      {
        onError: (error) => {
          toast({
            title: 'Error updating story status',
            description: error instanceof Error ? error.message : 'Failed to update story status',
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Handle drag start (for drag overlay)
  const handleDragStart = (event: { active: { id: string | number } }) => {
    const story = stories.find((s) => s.id === event.active.id);
    if (story) {
      setActiveStory(story);
    }
  };

  // Handle story card click
  const handleStoryClick = (story: Story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStory(null);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <StoryFilters
        epicFilter={epicFilter}
        searchTerm={searchTerm}
        onEpicFilterChange={setEpicFilter}
        onSearchTermChange={setSearchTerm}
        availableEpics={availableEpics}
      />

      {/* Kanban Board */}
      <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-16rem)]">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.status}
              status={column.status}
              title={column.title}
              stories={getStoriesForStatus(column.status)}
              onStoryClick={handleStoryClick}
              isDragDisabled={isDragDisabled}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeStory ? (
            <StoryCard story={activeStory} onClick={() => {}} isDragDisabled={true} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Story Detail Modal */}
      <StoryDetailModal story={selectedStory} isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
}

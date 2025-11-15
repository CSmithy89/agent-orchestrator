import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanColumn } from './KanbanColumn';
import type { Story } from '../../types/story';
import { DndContext } from '@dnd-kit/core';

const mockStories: Story[] = [
  {
    id: 'story-1-1',
    projectId: 'project-1',
    epicNumber: 1,
    storyNumber: 1,
    title: 'First story',
    status: 'ready',
    epic: { number: 1, title: 'Epic 1', color: 'blue' },
  },
  {
    id: 'story-1-2',
    projectId: 'project-1',
    epicNumber: 1,
    storyNumber: 2,
    title: 'Second story',
    status: 'ready',
    epic: { number: 1, title: 'Epic 1', color: 'blue' },
  },
];

describe('KanbanColumn', () => {
  it('renders column with title and story count', () => {
    const onStoryClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <KanbanColumn
          status="ready"
          title="Ready"
          stories={mockStories}
          onStoryClick={onStoryClick}
        />
      </DndContext>
    );

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders all stories in the column', () => {
    const onStoryClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <KanbanColumn
          status="ready"
          title="Ready"
          stories={mockStories}
          onStoryClick={onStoryClick}
        />
      </DndContext>
    );

    expect(screen.getByText('First story')).toBeInTheDocument();
    expect(screen.getByText('Second story')).toBeInTheDocument();
  });

  it('displays "No stories" message when column is empty', () => {
    const onStoryClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <KanbanColumn status="ready" title="Ready" stories={[]} onStoryClick={onStoryClick} />
      </DndContext>
    );

    expect(screen.getByText('No stories')).toBeInTheDocument();
  });

  it('renders story cards with click handlers', () => {
    const onStoryClick = vi.fn();

    render(
      <DndContext onDragEnd={vi.fn()}>
        <KanbanColumn
          status="ready"
          title="Ready"
          stories={mockStories}
          onStoryClick={onStoryClick}
        />
      </DndContext>
    );

    // Verify story cards are rendered with clickable styling
    const firstStoryCard = screen.getByText('First story').closest('.cursor-pointer');
    expect(firstStoryCard).toBeInTheDocument();
    expect(firstStoryCard).toHaveClass('cursor-pointer');
  });

  it('renders with accessibility attributes', () => {
    const onStoryClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <KanbanColumn
          status="ready"
          title="Ready"
          stories={mockStories}
          onStoryClick={onStoryClick}
        />
      </DndContext>
    );

    const region = screen.getByRole('region', { name: /Ready column with 2 stories/i });
    expect(region).toBeInTheDocument();
  });

  it('displays correct story count in aria-label', () => {
    const onStoryClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <KanbanColumn
          status="ready"
          title="Ready"
          stories={[mockStories[0]]}
          onStoryClick={onStoryClick}
        />
      </DndContext>
    );

    expect(screen.getByLabelText('1 story')).toBeInTheDocument();
  });
});

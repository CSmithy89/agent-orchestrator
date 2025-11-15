import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryCard } from './StoryCard';
import type { Story } from '../../types/story';
import { DndContext } from '@dnd-kit/core';

// Mock story data
const mockStory: Story = {
  id: 'story-1-1',
  projectId: 'project-1',
  epicNumber: 1,
  storyNumber: 1,
  title: 'Implement user authentication',
  status: 'in-progress',
  prUrl: 'https://github.com/example/repo/pull/123',
  dependencies: ['story-1-2', 'story-1-3'],
  epic: {
    number: 1,
    title: 'Foundation & Core Engine',
    color: 'blue',
  },
};

const mockStoryWithoutPR: Story = {
  ...mockStory,
  id: 'story-2-1',
  prUrl: undefined,
  dependencies: [],
};

describe('StoryCard', () => {
  it('renders story information correctly', () => {
    const onClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStory} onClick={onClick} />
      </DndContext>
    );

    expect(screen.getByText('story-1-1')).toBeInTheDocument();
    expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
    expect(screen.getByText('Epic 1')).toBeInTheDocument();
  });

  it('displays PR link when prUrl is provided', () => {
    const onClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStory} onClick={onClick} />
      </DndContext>
    );

    const prLink = screen.getByLabelText('Open pull request');
    expect(prLink).toBeInTheDocument();
    expect(prLink).toHaveAttribute('href', 'https://github.com/example/repo/pull/123');
    expect(prLink).toHaveAttribute('target', '_blank');
  });

  it('does not display PR link when prUrl is not provided', () => {
    const onClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStoryWithoutPR} onClick={onClick} />
      </DndContext>
    );

    expect(screen.queryByLabelText('Open pull request')).not.toBeInTheDocument();
  });

  it('displays dependency indicator when dependencies exist', () => {
    const onClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStory} onClick={onClick} />
      </DndContext>
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByLabelText('Has 2 dependencies')).toBeInTheDocument();
  });

  it('does not display dependency indicator when no dependencies', () => {
    const onClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStoryWithoutPR} onClick={onClick} />
      </DndContext>
    );

    expect(screen.queryByLabelText(/dependencies/i)).not.toBeInTheDocument();
  });

  it('renders card with click handler configured', () => {
    const onClick = vi.fn();

    render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStory} onClick={onClick} />
      </DndContext>
    );

    // Verify the card is rendered with the cursor-pointer class (indicates clickability)
    const card = screen.getByText('Implement user authentication').closest('.cursor-pointer');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('cursor-pointer');
  });

  it('calls onClick when Enter key is pressed', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStory} onClick={onClick} />
      </DndContext>
    );

    const card = screen.getByRole('button', { name: /Story story-1-1/i });
    card.focus();
    await user.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies epic color-coding based on epic number', () => {
    const onClick = vi.fn();
    const { container } = render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStory} onClick={onClick} />
      </DndContext>
    );

    const card = container.querySelector('.border-blue-500');
    expect(card).toBeInTheDocument();
  });

  it('prevents PR link click from triggering card onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStory} onClick={onClick} />
      </DndContext>
    );

    const prLink = screen.getByLabelText('Open pull request');
    await user.click(prLink);

    // Card onClick should not be called when PR link is clicked
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders with accessibility attributes', () => {
    const onClick = vi.fn();
    render(
      <DndContext onDragEnd={vi.fn()}>
        <StoryCard story={mockStory} onClick={onClick} />
      </DndContext>
    );

    const card = screen.getByRole('button', { name: /Story story-1-1/i });
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label');
  });
});

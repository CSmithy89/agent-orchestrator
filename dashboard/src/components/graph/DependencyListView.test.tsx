/**
 * DependencyListView Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
import { DependencyListView } from './DependencyListView';
import type { DependencyGraph } from '@/types/dependency-graph';

describe('DependencyListView', () => {
  const mockGraph: DependencyGraph = {
    nodes: [
      {
        id: '6-7',
        storyId: '6-7',
        epicNumber: 6,
        storyNumber: 7,
        title: 'Kanban Board',
        status: 'merged',
        complexity: 'large',
        hasWorktree: false,
      },
      {
        id: '6-8',
        storyId: '6-8',
        epicNumber: 6,
        storyNumber: 8,
        title: 'Dependency Graph',
        status: 'in-progress',
        complexity: 'medium',
        hasWorktree: true,
      },
    ],
    edges: [
      {
        source: '6-7',
        target: '6-8',
        type: 'hard',
        isBlocking: false,
      },
    ],
    criticalPath: ['6-7', '6-8'],
  };

  it('should render all stories', () => {
    render(<DependencyListView graph={mockGraph} />);

    expect(screen.getByText(/6\.7 - Kanban Board/)).toBeInTheDocument();
    expect(screen.getByText(/6\.8 - Dependency Graph/)).toBeInTheDocument();
  });

  it('should display story status badges', () => {
    render(<DependencyListView graph={mockGraph} />);

    expect(screen.getByText('Merged')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('should display complexity badges', () => {
    render(<DependencyListView graph={mockGraph} />);

    expect(screen.getByText('large')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('should display worktree indicator', () => {
    render(<DependencyListView graph={mockGraph} />);

    expect(screen.getByText('Active worktree')).toBeInTheDocument();
  });

  it('should expand and collapse dependencies', async () => {
    const user = userEvent.setup();
    render(<DependencyListView graph={mockGraph} />);

    // Story 6-8 has dependencies
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    // Dependencies section should be visible
    expect(screen.getByText(/Dependencies \(1\)/)).toBeInTheDocument();
  });

  it('should call onStoryClick when story is clicked', async () => {
    const user = userEvent.setup();
    const onStoryClick = vi.fn();

    render(<DependencyListView graph={mockGraph} onStoryClick={onStoryClick} />);

    const story = screen.getByText(/6\.7 - Kanban Board/);
    await user.click(story);

    expect(onStoryClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '6-7',
        title: 'Kanban Board',
      })
    );
  });

  it('should show blocking badge for blocking dependencies', async () => {
    const user = userEvent.setup();
    const graphWithBlocking: DependencyGraph = {
      ...mockGraph,
      edges: [
        {
          source: '6-7',
          target: '6-8',
          type: 'hard',
          isBlocking: true,
        },
      ],
    };

    render(<DependencyListView graph={graphWithBlocking} />);

    // Expand dependencies
    const expandButton = screen.getAllByRole('button')[0];
    await user.click(expandButton);

    expect(screen.getByText('Blocking')).toBeInTheDocument();
  });

  it('should show empty state when no stories', () => {
    const emptyGraph: DependencyGraph = {
      nodes: [],
      edges: [],
      criticalPath: [],
    };

    render(<DependencyListView graph={emptyGraph} />);

    expect(screen.getByText('No stories to display')).toBeInTheDocument();
  });
});

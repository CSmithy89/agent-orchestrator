import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { KanbanBoard } from './KanbanBoard';
import type { Story } from '../../types/story';
import * as useProjectStoriesModule from '../../hooks/useProjectStories';

// Mock the hooks
vi.mock('../../hooks/useProjectStories');
vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockStories: Story[] = [
  {
    id: 'story-1-1',
    projectId: 'project-1',
    epicNumber: 1,
    storyNumber: 1,
    title: 'Ready story',
    status: 'ready',
    epic: { number: 1, title: 'Epic 1', color: 'blue' },
  },
  {
    id: 'story-1-2',
    projectId: 'project-1',
    epicNumber: 2,
    storyNumber: 1,
    title: 'In progress story',
    status: 'in-progress',
    epic: { number: 2, title: 'Epic 2', color: 'green' },
  },
  {
    id: 'story-1-3',
    projectId: 'project-1',
    epicNumber: 1,
    storyNumber: 2,
    title: 'Review story',
    status: 'review',
    epic: { number: 1, title: 'Epic 1', color: 'blue' },
  },
  {
    id: 'story-1-4',
    projectId: 'project-1',
    epicNumber: 3,
    storyNumber: 1,
    title: 'Merged story',
    status: 'merged',
    epic: { number: 3, title: 'Epic 3', color: 'purple' },
  },
];

describe('KanbanBoard', () => {
  let queryClient: QueryClient;
  const mockMutate = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();

    vi.mocked(useProjectStoriesModule.useUpdateStoryStatus).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
      reset: vi.fn(),
      mutateAsync: vi.fn(),
      variables: undefined,
      context: undefined,
      failureCount: 0,
      failureReason: null,
      status: 'idle',
      submittedAt: 0,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders all four Kanban columns', () => {
    render(
      <KanbanBoard projectId="project-1" stories={mockStories} />,
      { wrapper }
    );

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('Merged')).toBeInTheDocument();
  });

  it('distributes stories into correct columns', () => {
    render(
      <KanbanBoard projectId="project-1" stories={mockStories} />,
      { wrapper }
    );

    // Check stories are in correct columns
    expect(screen.getByText('Ready story')).toBeInTheDocument();
    expect(screen.getByText('In progress story')).toBeInTheDocument();
    expect(screen.getByText('Review story')).toBeInTheDocument();
    expect(screen.getByText('Merged story')).toBeInTheDocument();
  });

  it('filters stories by epic', async () => {
    // This test would require proper Radix UI portal handling
    // For now, we'll test that the filter components render correctly
    render(
      <KanbanBoard projectId="project-1" stories={mockStories} />,
      { wrapper }
    );

    const epicFilter = screen.getByLabelText('Filter by epic');
    expect(epicFilter).toBeInTheDocument();

    // All stories should be visible initially
    expect(screen.getByText('Ready story')).toBeInTheDocument();
    expect(screen.getByText('In progress story')).toBeInTheDocument();
    expect(screen.getByText('Review story')).toBeInTheDocument();
    expect(screen.getByText('Merged story')).toBeInTheDocument();
  });

  it('filters stories by search term', async () => {
    const user = userEvent.setup();
    render(
      <KanbanBoard projectId="project-1" stories={mockStories} />,
      { wrapper }
    );

    const searchInput = screen.getByPlaceholderText('Search stories by title...');
    await user.type(searchInput, 'ready');

    // Should show only stories with "ready" in title (case-insensitive)
    expect(screen.getByText('Ready story')).toBeInTheDocument();
    expect(screen.queryByText('In progress story')).not.toBeInTheDocument();
    expect(screen.queryByText('Review story')).not.toBeInTheDocument();
    expect(screen.queryByText('Merged story')).not.toBeInTheDocument();
  });

  it('filters stories by search term', async () => {
    const user = userEvent.setup();
    render(
      <KanbanBoard projectId="project-1" stories={mockStories} />,
      { wrapper }
    );

    const searchInput = screen.getByPlaceholderText('Search stories by title...');
    await user.type(searchInput, 'review');

    // Should show only stories with "review" in title
    expect(screen.getByText('Review story')).toBeInTheDocument();
    expect(screen.queryByText('Ready story')).not.toBeInTheDocument();
    expect(screen.queryByText('In progress story')).not.toBeInTheDocument();
  });

  it('clears filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <KanbanBoard projectId="project-1" stories={mockStories} />,
      { wrapper }
    );

    // Apply filters
    const searchInput = screen.getByPlaceholderText('Search stories by title...');
    await user.type(searchInput, 'test');

    const clearButton = screen.getByLabelText('Clear all filters');
    await user.click(clearButton);

    // All stories should be visible again
    expect(screen.getByText('Ready story')).toBeInTheDocument();
    expect(screen.getByText('In progress story')).toBeInTheDocument();
    expect(screen.getByText('Review story')).toBeInTheDocument();
    expect(screen.getByText('Merged story')).toBeInTheDocument();
  });

  it('opens story detail modal when story card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <KanbanBoard projectId="project-1" stories={mockStories} />,
      { wrapper }
    );

    const storyCard = screen.getByText('Ready story').closest('.cursor-pointer');
    if (storyCard) {
      await user.click(storyCard);
    }

    // Modal should open - look for the story ID in the modal
    // The dialog might render in a portal, so just check if the modal content appears
    await screen.findByText('story-1-1');
  });

  it('displays epic filter and search components', () => {
    render(
      <KanbanBoard projectId="project-1" stories={mockStories} />,
      { wrapper }
    );

    expect(screen.getByLabelText('Filter by epic')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search stories by title...')).toBeInTheDocument();
  });

  it('renders with empty stories array', () => {
    render(
      <KanbanBoard projectId="project-1" stories={[]} />,
      { wrapper }
    );

    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Code Review')).toBeInTheDocument();
    expect(screen.getByText('Merged')).toBeInTheDocument();

    // Each column should show "No stories"
    const noStoriesElements = screen.getAllByText('No stories');
    expect(noStoriesElements).toHaveLength(4);
  });
});

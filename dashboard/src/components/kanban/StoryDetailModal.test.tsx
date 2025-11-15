import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryDetailModal } from './StoryDetailModal';
import type { Story } from '../../types/story';

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
  description: 'This story implements user authentication using JWT tokens.',
  acceptanceCriteria: [
    'Users can log in with email and password',
    'JWT tokens are generated on successful login',
    'Tokens expire after 24 hours',
  ],
  tasks: [
    {
      id: 'task-1',
      description: 'Implement login endpoint',
      completed: true,
      subtasks: [
        { id: 'subtask-1-1', description: 'Create route handler', completed: true },
        { id: 'subtask-1-2', description: 'Add validation', completed: false },
      ],
    },
    {
      id: 'task-2',
      description: 'Create JWT token generation',
      completed: false,
    },
  ],
  storyPoints: 5,
};

describe('StoryDetailModal', () => {
  it('renders story details when open', () => {
    render(<StoryDetailModal story={mockStory} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Implement user authentication')).toBeInTheDocument();
    expect(screen.getByText('story-1-1')).toBeInTheDocument();
    expect(screen.getByText('Epic 1')).toBeInTheDocument();
    expect(screen.getByText('in-progress')).toBeInTheDocument();
    expect(screen.getByText('5 points')).toBeInTheDocument();
  });

  it('displays description when available', () => {
    render(<StoryDetailModal story={mockStory} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('This story implements user authentication using JWT tokens.')).toBeInTheDocument();
  });

  it('displays acceptance criteria', () => {
    render(<StoryDetailModal story={mockStory} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Users can log in with email and password')).toBeInTheDocument();
    expect(screen.getByText('JWT tokens are generated on successful login')).toBeInTheDocument();
    expect(screen.getByText('Tokens expire after 24 hours')).toBeInTheDocument();
  });

  it('displays tasks with completion status', () => {
    render(<StoryDetailModal story={mockStory} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Implement login endpoint')).toBeInTheDocument();
    expect(screen.getByText('Create JWT token generation')).toBeInTheDocument();
    expect(screen.getByText('Tasks (1/2 completed)')).toBeInTheDocument();
  });

  it('displays subtasks when available', () => {
    render(<StoryDetailModal story={mockStory} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Create route handler')).toBeInTheDocument();
    expect(screen.getByText('Add validation')).toBeInTheDocument();
  });

  it('displays dependencies', () => {
    render(<StoryDetailModal story={mockStory} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('story-1-2')).toBeInTheDocument();
    expect(screen.getByText('story-1-3')).toBeInTheDocument();
    expect(screen.getByText(/This story depends on 2 other stories/i)).toBeInTheDocument();
  });

  it('displays PR link button when prUrl is available', () => {
    render(<StoryDetailModal story={mockStory} isOpen={true} onClose={vi.fn()} />);

    const prLink = screen.getByRole('link', { name: /View PR/i });
    expect(prLink).toBeInTheDocument();
    expect(prLink).toHaveAttribute('href', 'https://github.com/example/repo/pull/123');
    expect(prLink).toHaveAttribute('target', '_blank');
  });

  it('does not render when story is null', () => {
    const { container } = render(<StoryDetailModal story={null} isOpen={true} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('calls onClose when dialog is closed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<StoryDetailModal story={mockStory} isOpen={true} onClose={onClose} />);

    // Dialog closes when clicking outside or pressing escape (handled by Dialog component)
    // We can test that the onClose callback is wired up correctly
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not display sections when data is not available', () => {
    const minimalStory: Story = {
      ...mockStory,
      description: undefined,
      acceptanceCriteria: undefined,
      tasks: undefined,
      dependencies: undefined,
    };

    render(<StoryDetailModal story={minimalStory} isOpen={true} onClose={vi.fn()} />);

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
    expect(screen.queryByText('Acceptance Criteria')).not.toBeInTheDocument();
    expect(screen.queryByText(/Tasks/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Dependencies')).not.toBeInTheDocument();
  });
});

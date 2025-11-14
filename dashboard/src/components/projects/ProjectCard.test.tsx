import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import { ProjectCard } from './ProjectCard';
import type { Project } from '../../api/types';
import userEvent from '@testing-library/user-event';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ProjectCard', () => {
  const mockProject: Project = {
    id: 'proj-1',
    name: 'Test Project',
    status: 'active',
    phase: 'implementation',
    createdAt: '2025-11-14T00:00:00Z',
    updatedAt: '2025-11-14T12:00:00Z',
    repository: 'https://github.com/test/repo',
  };

  it('should render project name and repository', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('https://github.com/test/repo')).toBeInTheDocument();
  });

  it('should display phase badge with correct variant', () => {
    render(<ProjectCard project={mockProject} />);

    const badge = screen.getByText('implementation');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100');
  });

  it('should display progress bar', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('should display project status', () => {
    render(<ProjectCard project={mockProject} />);

    expect(screen.getByText(/Status:/)).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should navigate to project detail on click', async () => {
    const user = userEvent.setup();
    render(<ProjectCard project={mockProject} />);

    const card = screen.getByRole('button', { name: /View details for project Test Project/i });
    await user.click(card);

    expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-1');
  });

  it('should navigate to project detail on Enter key', async () => {
    const user = userEvent.setup();
    render(<ProjectCard project={mockProject} />);

    const card = screen.getByRole('button', { name: /View details for project Test Project/i });
    card.focus();
    await user.keyboard('{Enter}');

    expect(mockNavigate).toHaveBeenCalledWith('/projects/proj-1');
  });

  it('should display different phase badge colors', () => {
    const { rerender } = render(<ProjectCard project={{ ...mockProject, phase: 'analysis' }} />);
    expect(screen.getByText('analysis')).toHaveClass('bg-blue-100');

    rerender(<ProjectCard project={{ ...mockProject, phase: 'planning' }} />);
    expect(screen.getByText('planning')).toHaveClass('bg-yellow-100');

    rerender(<ProjectCard project={{ ...mockProject, phase: 'solutioning' }} />);
    expect(screen.getByText('solutioning')).toHaveClass('bg-orange-100');
  });
});

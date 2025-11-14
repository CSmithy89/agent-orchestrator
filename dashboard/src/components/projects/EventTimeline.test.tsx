import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import { EventTimeline } from './EventTimeline';
import type { EventLog } from '../../api/types';

describe('EventTimeline', () => {
  const mockEvents: EventLog[] = [
    {
      id: 'event-1',
      projectId: 'proj-1',
      eventType: 'agent.started',
      description: 'Agent started working on story',
      timestamp: '2025-11-14T10:00:00Z',
    },
    {
      id: 'event-2',
      projectId: 'proj-1',
      eventType: 'pr.merged',
      description: 'Pull request merged successfully',
      timestamp: '2025-11-14T09:00:00Z',
      data: { prNumber: 123, branch: 'feature/new-feature' },
    },
    {
      id: 'event-3',
      projectId: 'proj-1',
      eventType: 'workflow.error',
      description: 'Workflow encountered an error',
      timestamp: '2025-11-14T08:00:00Z',
    },
  ];

  it('should render event timeline', () => {
    render(<EventTimeline events={mockEvents} />);

    expect(screen.getByText('Recent Events')).toBeInTheDocument();
    expect(screen.getByText('Agent started working on story')).toBeInTheDocument();
    expect(screen.getByText('Pull request merged successfully')).toBeInTheDocument();
  });

  it('should sort events by timestamp (most recent first)', () => {
    render(<EventTimeline events={mockEvents} />);

    const descriptions = screen.getAllByText(/started|merged|error/);
    // Most recent event should be first
    expect(descriptions[0].textContent).toContain('started');
  });

  it('should show empty state when no events', () => {
    render(<EventTimeline events={[]} />);

    expect(screen.getByText('No recent events')).toBeInTheDocument();
  });

  it('should expand event details when clicked', async () => {
    const user = userEvent.setup();
    render(<EventTimeline events={mockEvents} />);

    const showDetailsButton = screen.getByRole('button', { name: /Show details/i });
    await user.click(showDetailsButton);

    expect(screen.getByText(/Hide details/i)).toBeInTheDocument();
    expect(screen.getByText(/"prNumber": 123/)).toBeInTheDocument();
  });

  it('should hide details when clicked again', async () => {
    const user = userEvent.setup();
    render(<EventTimeline events={mockEvents} />);

    const showDetailsButton = screen.getByRole('button', { name: /Show details/i });
    await user.click(showDetailsButton);

    const hideDetailsButton = screen.getByRole('button', { name: /Hide details/i });
    await user.click(hideDetailsButton);

    expect(screen.getByRole('button', { name: /Show details/i })).toBeInTheDocument();
  });
});

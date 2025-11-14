import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import { ActiveAgentsList } from './ActiveAgentsList';
import type { AgentActivity } from '../../api/types';

describe('ActiveAgentsList', () => {
  const mockAgents: AgentActivity[] = [
    {
      agentId: 'agent-1',
      agentName: 'Dev Agent',
      currentTask: 'Implementing authentication feature',
      startTime: '2025-11-14T10:00:00Z',
      status: 'active',
      projectId: 'proj-1',
    },
    {
      agentId: 'agent-2',
      agentName: 'Test Agent',
      currentTask: 'Writing unit tests',
      startTime: '2025-11-14T09:30:00Z',
      status: 'active',
      projectId: 'proj-1',
    },
  ];

  it('should render agent list', () => {
    render(<ActiveAgentsList agents={mockAgents} />);

    expect(screen.getByText('Active Agents')).toBeInTheDocument();
    expect(screen.getByText('Dev Agent')).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  it('should display agent tasks', () => {
    render(<ActiveAgentsList agents={mockAgents} />);

    expect(screen.getByText('Implementing authentication feature')).toBeInTheDocument();
    expect(screen.getByText('Writing unit tests')).toBeInTheDocument();
  });

  it('should display agent status badges', () => {
    render(<ActiveAgentsList agents={mockAgents} />);

    const activeBadges = screen.getAllByText('active');
    expect(activeBadges).toHaveLength(2);
  });

  it('should show empty state when no agents', () => {
    render(<ActiveAgentsList agents={[]} />);

    expect(screen.getByText('No active agents at the moment')).toBeInTheDocument();
  });

  it('should display relative start times', () => {
    render(<ActiveAgentsList agents={mockAgents} />);

    const startedTexts = screen.getAllByText(/Started/);
    expect(startedTexts.length).toBeGreaterThan(0);
  });
});

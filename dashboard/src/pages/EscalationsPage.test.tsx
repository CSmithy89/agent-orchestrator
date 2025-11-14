import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import { EscalationsPage } from './EscalationsPage';
import { escalationsApi } from '../api/escalations';
import type { EscalationStatus } from '../api/types';

vi.mock('../api/escalations', () => ({
  escalationsApi: {
    getEscalations: vi.fn(),
    getEscalation: vi.fn(),
  },
}));

vi.mock('../hooks/useEscalationWebSocket', () => ({
  useEscalationWebSocket: () => ({
    connectionStatus: 'connected',
    events: [],
    subscribe: vi.fn(),
  }),
}));

const mockEscalations: EscalationStatus[] = [
  {
    id: '1',
    projectId: 'proj-1',
    type: 'decision',
    severity: 'high',
    title: 'Pending Escalation 1',
    description: 'Test description',
    question: 'Test question 1?',
    aiReasoning: 'Test reasoning',
    confidenceScore: 0.65,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    projectId: 'proj-1',
    type: 'clarification',
    severity: 'medium',
    title: 'Pending Escalation 2',
    description: 'Test description 2',
    question: 'Test question 2?',
    confidenceScore: 0.45,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

const mockResolvedEscalations: EscalationStatus[] = [
  {
    id: '3',
    projectId: 'proj-1',
    type: 'decision',
    severity: 'low',
    title: 'Resolved Escalation',
    description: 'Test description',
    question: 'Test question?',
    confidenceScore: 0.5,
    status: 'resolved',
    createdAt: new Date().toISOString(),
    respondedAt: new Date().toISOString(),
  },
];

describe('EscalationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page header', () => {
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });

    render(<EscalationsPage />);

    expect(screen.getByText('Escalations')).toBeInTheDocument();
    expect(
      screen.getByText('Review and respond to workflow escalations that require your attention')
    ).toBeInTheDocument();
  });

  it('should render filter tabs', () => {
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });

    render(<EscalationsPage />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('should display pending escalations by default', async () => {
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: mockEscalations,
      timestamp: new Date().toISOString(),
    });

    render(<EscalationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Pending Escalation 1')).toBeInTheDocument();
      expect(screen.getByText('Pending Escalation 2')).toBeInTheDocument();
    });
  });

  it('should filter escalations when tab is changed', async () => {
    const user = userEvent.setup();

    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: mockEscalations,
      timestamp: new Date().toISOString(),
    });

    render(<EscalationsPage />);

    // Initially shows pending
    await waitFor(() => {
      expect(screen.getByText('Pending Escalation 1')).toBeInTheDocument();
    });

    // Switch to resolved
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: mockResolvedEscalations,
      timestamp: new Date().toISOString(),
    });

    const resolvedTab = screen.getByText('Resolved');
    await user.click(resolvedTab);

    await waitFor(() => {
      expect(screen.getByText('Resolved Escalation')).toBeInTheDocument();
    });
  });

  it('should show loading skeletons while fetching', () => {
    vi.mocked(escalationsApi.getEscalations).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<EscalationsPage />);

    // Check for skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show empty state when no escalations', async () => {
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });

    render(<EscalationsPage />);

    await waitFor(() => {
      expect(screen.getByText('No escalations found')).toBeInTheDocument();
      expect(
        screen.getByText("You're all caught up! There are no pending escalations at the moment.")
      ).toBeInTheDocument();
    });
  });

  it('should show error state on API failure', async () => {
    vi.mocked(escalationsApi.getEscalations).mockRejectedValue(new Error('API Error'));

    render(<EscalationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load escalations')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('should open detail modal when escalation card is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: mockEscalations,
      timestamp: new Date().toISOString(),
    });

    vi.mocked(escalationsApi.getEscalation).mockResolvedValue({
      success: true,
      data: {
        ...mockEscalations[0],
        agentId: 'agent-1',
        workflowStep: 'step-1',
      },
      timestamp: new Date().toISOString(),
    });

    render(<EscalationsPage />);

    await waitFor(() => {
      expect(screen.getByText('Pending Escalation 1')).toBeInTheDocument();
    });

    const card = screen.getByText('Pending Escalation 1').closest('.p-4');
    await user.click(card!);

    await waitFor(() => {
      expect(escalationsApi.getEscalation).toHaveBeenCalledWith('1');
    });
  });
});

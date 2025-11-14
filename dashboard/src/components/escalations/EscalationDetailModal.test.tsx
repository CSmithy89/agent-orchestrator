import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import { EscalationDetailModal } from './EscalationDetailModal';
import { escalationsApi } from '../../api/escalations';
import type { EscalationDetail } from '../../api/types';

vi.mock('../../api/escalations', () => ({
  escalationsApi: {
    respondToEscalation: vi.fn(),
  },
}));

const mockPendingEscalation: EscalationDetail = {
  id: '1',
  projectId: 'proj-1',
  type: 'decision',
  severity: 'high',
  title: 'Critical Decision Required',
  description: 'Test description',
  question: 'Should we proceed with deployment?',
  context: 'Additional context information',
  aiReasoning: 'The AI analyzed the situation and suggests proceeding',
  attemptedDecision: 'Proceed with deployment',
  confidenceScore: 0.65,
  status: 'pending',
  createdAt: new Date().toISOString(),
  agentId: 'agent-1',
  workflowStep: 'deployment',
};

const mockResolvedEscalation: EscalationDetail = {
  ...mockPendingEscalation,
  id: '2',
  status: 'resolved',
  respondedAt: new Date().toISOString(),
  response: {
    response: 'Yes, proceed with deployment',
    decision: 'approve',
  },
};

describe('EscalationDetailModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render escalation details correctly', () => {
    render(
      <EscalationDetailModal
        escalation={mockPendingEscalation}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText('Critical Decision Required')).toBeInTheDocument();
    expect(screen.getByText('Should we proceed with deployment?')).toBeInTheDocument();
    expect(screen.getByText('Additional context information')).toBeInTheDocument();
    expect(screen.getByText('The AI analyzed the situation and suggests proceeding')).toBeInTheDocument();
    expect(screen.getByText('Proceed with deployment')).toBeInTheDocument();
  });

  it('should show confidence score with correct percentage', () => {
    render(
      <EscalationDetailModal
        escalation={mockPendingEscalation}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText('65%')).toBeInTheDocument();
  });

  it('should show response input for pending escalations', () => {
    render(
      <EscalationDetailModal
        escalation={mockPendingEscalation}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByPlaceholderText('Enter your decision or guidance...')).toBeInTheDocument();
    expect(screen.getByText('Submit Response')).toBeInTheDocument();
  });

  it('should not show response input for resolved escalations', () => {
    render(
      <EscalationDetailModal
        escalation={mockResolvedEscalation}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(screen.queryByPlaceholderText('Enter your decision or guidance...')).not.toBeInTheDocument();
    expect(screen.queryByText('Submit Response')).not.toBeInTheDocument();
  });

  it('should show existing response for resolved escalations', () => {
    render(
      <EscalationDetailModal
        escalation={mockResolvedEscalation}
        open={true}
        onOpenChange={() => {}}
      />
    );

    expect(screen.getByText('Yes, proceed with deployment')).toBeInTheDocument();
  });

  it('should submit response when button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    vi.mocked(escalationsApi.respondToEscalation).mockResolvedValue({
      success: true,
      data: { ...mockPendingEscalation, status: 'responded' },
      timestamp: new Date().toISOString(),
    });

    render(
      <EscalationDetailModal
        escalation={mockPendingEscalation}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    const textarea = screen.getByPlaceholderText('Enter your decision or guidance...');
    await user.type(textarea, 'Yes, proceed');

    const submitButton = screen.getByText('Submit Response');
    await user.click(submitButton);

    await waitFor(() => {
      expect(escalationsApi.respondToEscalation).toHaveBeenCalledWith('1', {
        response: 'Yes, proceed',
      });
    });

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should disable submit button when response is empty', () => {
    render(
      <EscalationDetailModal
        escalation={mockPendingEscalation}
        open={true}
        onOpenChange={() => {}}
      />
    );

    const submitButton = screen.getByText('Submit Response');
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();

    vi.mocked(escalationsApi.respondToEscalation).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                success: true,
                data: { ...mockPendingEscalation, status: 'responded' },
                timestamp: new Date().toISOString(),
              }),
            100
          )
        )
    );

    render(
      <EscalationDetailModal
        escalation={mockPendingEscalation}
        open={true}
        onOpenChange={() => {}}
      />
    );

    const textarea = screen.getByPlaceholderText('Enter your decision or guidance...');
    await user.type(textarea, 'Test response');

    const submitButton = screen.getByText('Submit Response');
    await user.click(submitButton);

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('should not render when escalation is null', () => {
    const { container } = render(
      <EscalationDetailModal escalation={null} open={true} onOpenChange={() => {}} />
    );

    expect(container.firstChild).toBeNull();
  });
});

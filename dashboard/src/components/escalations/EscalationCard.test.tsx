import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import { EscalationCard } from './EscalationCard';
import type { EscalationStatus } from '../../api/types';

const mockPendingEscalation: EscalationStatus = {
  id: '1',
  projectId: 'proj-1',
  type: 'decision',
  severity: 'high',
  title: 'Critical Decision Required',
  description: 'Test description',
  question: 'Should we proceed with deployment?',
  aiReasoning: 'Test reasoning',
  confidenceScore: 0.65,
  status: 'pending',
  createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
};

const mockResolvedEscalation: EscalationStatus = {
  ...mockPendingEscalation,
  id: '2',
  title: 'Resolved Escalation',
  status: 'resolved',
  respondedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
};

describe('EscalationCard', () => {
  it('should render pending escalation correctly', () => {
    render(<EscalationCard escalation={mockPendingEscalation} />);

    expect(screen.getByText('Critical Decision Required')).toBeInTheDocument();
    expect(screen.getByText('Should we proceed with deployment?')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('decision')).toBeInTheDocument();
    expect(screen.getByText(/Confidence: 65%/)).toBeInTheDocument();
  });

  it('should render resolved escalation with visual distinction', () => {
    render(<EscalationCard escalation={mockResolvedEscalation} />);

    expect(screen.getByText('Resolved Escalation')).toBeInTheDocument();

    // Check for "Resolved" with "ago" to match the timestamp text specifically
    expect(screen.getByText(/Resolved.*ago/)).toBeInTheDocument();

    const card = screen.getByText('Resolved Escalation').closest('.p-4');
    expect(card).toHaveClass('opacity-60');
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<EscalationCard escalation={mockPendingEscalation} onClick={onClick} />);

    const card = screen.getByText('Critical Decision Required').closest('.p-4');
    await user.click(card!);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should display correct severity badge color', () => {
    const { rerender } = render(<EscalationCard escalation={mockPendingEscalation} />);

    // High severity
    expect(screen.getByText('high')).toHaveClass('bg-orange-100');

    // Critical severity
    const criticalEscalation = { ...mockPendingEscalation, severity: 'critical' as const };
    rerender(<EscalationCard escalation={criticalEscalation} />);
    expect(screen.getByText('critical')).toHaveClass('bg-red-100');

    // Medium severity
    const mediumEscalation = { ...mockPendingEscalation, severity: 'medium' as const };
    rerender(<EscalationCard escalation={mediumEscalation} />);
    expect(screen.getByText('medium')).toHaveClass('bg-yellow-100');

    // Low severity
    const lowEscalation = { ...mockPendingEscalation, severity: 'low' as const };
    rerender(<EscalationCard escalation={lowEscalation} />);
    expect(screen.getByText('low')).toHaveClass('bg-blue-100');
  });

  it('should not show confidence score for resolved escalations', () => {
    render(<EscalationCard escalation={mockResolvedEscalation} />);

    expect(screen.queryByText(/Confidence:/)).not.toBeInTheDocument();
  });

  it('should show confidence score for pending escalations', () => {
    render(<EscalationCard escalation={mockPendingEscalation} />);

    expect(screen.getByText(/Confidence: 65%/)).toBeInTheDocument();
  });
});

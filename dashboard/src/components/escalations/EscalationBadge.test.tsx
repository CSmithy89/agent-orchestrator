import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test-utils/test-utils';
import { EscalationBadge } from './EscalationBadge';
import { escalationsApi } from '../../api/escalations';
import type { EscalationStatus } from '../../api/types';

vi.mock('../../api/escalations', () => ({
  escalationsApi: {
    getEscalations: vi.fn(),
  },
}));

const mockPendingEscalations: EscalationStatus[] = [
  {
    id: '1',
    projectId: 'proj-1',
    type: 'decision',
    severity: 'high',
    title: 'Test 1',
    description: 'Test',
    question: 'Test?',
    confidenceScore: 0.5,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    projectId: 'proj-1',
    type: 'clarification',
    severity: 'medium',
    title: 'Test 2',
    description: 'Test',
    question: 'Test?',
    confidenceScore: 0.6,
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

describe('EscalationBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show badge with correct count when there are pending escalations', async () => {
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: mockPendingEscalations,
      timestamp: new Date().toISOString(),
    });

    render(<EscalationBadge />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    expect(screen.getByText('Escalations')).toBeInTheDocument();
  });

  it('should not render when there are no pending escalations', async () => {
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });

    const { container } = render(<EscalationBadge />);

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('should link to /escalations route', async () => {
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: mockPendingEscalations,
      timestamp: new Date().toISOString(),
    });

    render(<EscalationBadge />);

    await waitFor(() => {
      const link = screen.getByText('Escalations').closest('a');
      expect(link).toHaveAttribute('href', '/escalations');
    });
  });
});

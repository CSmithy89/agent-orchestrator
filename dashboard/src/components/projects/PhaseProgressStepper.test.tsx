import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test-utils/test-utils';
import { PhaseProgressStepper } from './PhaseProgressStepper';
import type { PhaseProgress } from '../../api/types';

describe('PhaseProgressStepper', () => {
  const mockPhaseProgress: PhaseProgress[] = [
    { phase: 'analysis', progress: 100, completedTasks: 5, totalTasks: 5 },
    { phase: 'planning', progress: 100, completedTasks: 3, totalTasks: 3 },
    { phase: 'solutioning', progress: 50, completedTasks: 2, totalTasks: 4 },
    { phase: 'implementation', progress: 0, completedTasks: 0, totalTasks: 8 },
  ];

  it('should render all phases', () => {
    render(<PhaseProgressStepper phaseProgress={mockPhaseProgress} currentPhase="solutioning" />);

    expect(screen.getByText('Analysis')).toBeInTheDocument();
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Solutioning')).toBeInTheDocument();
    expect(screen.getByText('Implementation')).toBeInTheDocument();
  });

  it('should mark current phase with badge', () => {
    render(<PhaseProgressStepper phaseProgress={mockPhaseProgress} currentPhase="solutioning" />);

    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('should mark completed phases', () => {
    render(<PhaseProgressStepper phaseProgress={mockPhaseProgress} currentPhase="solutioning" />);

    const completeBadges = screen.getAllByText('Complete');
    expect(completeBadges).toHaveLength(2); // Analysis and Planning
  });

  it('should display progress bars for current and completed phases', () => {
    render(<PhaseProgressStepper phaseProgress={mockPhaseProgress} currentPhase="solutioning" />);

    // Should show task completion for completed and current phases
    expect(screen.getByText('5 / 5 tasks')).toBeInTheDocument(); // Analysis
    expect(screen.getByText('3 / 3 tasks')).toBeInTheDocument(); // Planning
    expect(screen.getByText('2 / 4 tasks')).toBeInTheDocument(); // Solutioning (current)
  });

  it('should display correct progress percentages', () => {
    render(<PhaseProgressStepper phaseProgress={mockPhaseProgress} currentPhase="solutioning" />);

    expect(screen.getAllByText('100%')).toHaveLength(2); // Analysis and Planning
    expect(screen.getByText('50%')).toBeInTheDocument(); // Solutioning
  });
});

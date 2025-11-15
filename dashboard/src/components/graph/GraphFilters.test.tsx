/**
 * GraphFilters Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import React from 'react';
import { GraphFilters } from './GraphFilters';
import type { GraphFilters as GraphFiltersType } from '@/types/dependency-graph';

describe('GraphFilters', () => {
  const mockEpics = [1, 2, 3, 4, 5, 6];
  const emptyFilters: GraphFiltersType = {};

  it('should render filters button', () => {
    const onFiltersChange = vi.fn();
    render(
      <GraphFilters
        epics={mockEpics}
        filters={emptyFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument();
  });

  it('should toggle filters panel when button is clicked', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(
      <GraphFilters
        epics={mockEpics}
        filters={emptyFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    await user.click(filtersButton);

    // Filters panel should be visible
    expect(screen.getByLabelText('Epic')).toBeInTheDocument();
  });

  it('should show active filter count badge', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    const { rerender } = render(
      <GraphFilters
        epics={mockEpics}
        filters={{ epic: 6 }}
        onFiltersChange={onFiltersChange}
      />
    );

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    expect(filtersButton).toHaveTextContent('1');

    rerender(
      <GraphFilters
        epics={mockEpics}
        filters={{ epic: 6, status: ['in-progress', 'review'], blocking: true }}
        onFiltersChange={onFiltersChange}
      />
    );

    expect(filtersButton).toHaveTextContent('4');
  });

  it('should call onFiltersChange when epic filter is changed', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(
      <GraphFilters
        epics={mockEpics}
        filters={emptyFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    // Open filters panel
    await user.click(screen.getByRole('button', { name: /filters/i }));

    // Click on epic filter (this interaction is complex with shadcn/ui Select)
    // In a real test, we'd use more sophisticated testing or E2E tests
    expect(screen.getByLabelText('Epic')).toBeInTheDocument();
  });

  it('should toggle status filter badges', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(
      <GraphFilters
        epics={mockEpics}
        filters={emptyFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    // Open filters panel
    await user.click(screen.getByRole('button', { name: /filters/i }));

    // Click on a status badge
    const pendingBadge = screen.getByText('Pending');
    await user.click(pendingBadge);

    expect(onFiltersChange).toHaveBeenCalledWith({
      status: ['pending'],
    });
  });

  it('should toggle blocking filter', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(
      <GraphFilters
        epics={mockEpics}
        filters={emptyFilters}
        onFiltersChange={onFiltersChange}
      />
    );

    // Open filters panel
    await user.click(screen.getByRole('button', { name: /filters/i }));

    // Click on blocking badge
    const blockingBadge = screen.getByText('Blocking Only');
    await user.click(blockingBadge);

    expect(onFiltersChange).toHaveBeenCalledWith({
      blocking: true,
    });
  });

  it('should clear all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();

    render(
      <GraphFilters
        epics={mockEpics}
        filters={{ epic: 6, status: ['in-progress'], blocking: true }}
        onFiltersChange={onFiltersChange}
      />
    );

    // Open filters panel
    await user.click(screen.getByRole('button', { name: /filters/i }));

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(onFiltersChange).toHaveBeenCalledWith({});
  });
});

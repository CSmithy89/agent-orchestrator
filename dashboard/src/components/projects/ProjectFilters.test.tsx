import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectFilters } from './ProjectFilters';

describe('ProjectFilters', () => {
  it('should render all filter controls', () => {
    const onFilterChange = vi.fn();
    render(<ProjectFilters onFilterChange={onFilterChange} />);

    expect(screen.getByPlaceholderText('Search projects...')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by phase/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sort by/i })).toBeInTheDocument();
  });

  it('should debounce search input', async () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<ProjectFilters onFilterChange={onFilterChange} />);

    const searchInput = screen.getByPlaceholderText('Search projects...');
    await user.type(searchInput, 'test');

    // Should not call immediately
    expect(onFilterChange).not.toHaveBeenCalled();

    // Advance timers to trigger debounce
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // Should call after debounce delay
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'test' })
    );

    vi.useRealTimers();
  });

  it('should toggle sort order', async () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    const user = userEvent.setup({ delay: null });
    render(<ProjectFilters onFilterChange={onFilterChange} />);

    const sortButton = screen.getByRole('button', { name: /Last Updated/i });

    await act(async () => {
      await user.click(sortButton);
      vi.advanceTimersByTime(500);
    });

    // Button text should have changed to "Name"
    expect(screen.getByRole('button', { name: /Name/i })).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('should call onFilterChange with initial values', async () => {
    vi.useFakeTimers();
    const onFilterChange = vi.fn();
    render(<ProjectFilters onFilterChange={onFilterChange} />);

    // Wait for initial useEffect to fire
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(onFilterChange).toHaveBeenCalledWith({
      phase: 'all',
      status: 'all',
      search: '',
      sortBy: 'lastUpdated',
    });

    vi.useRealTimers();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StoryFilters } from './StoryFilters';

describe('StoryFilters', () => {
  const defaultProps = {
    epicFilter: null,
    searchTerm: '',
    onEpicFilterChange: vi.fn(),
    onSearchTermChange: vi.fn(),
    availableEpics: [1, 2, 3, 4, 5],
  };

  it('renders epic filter and search input', () => {
    render(<StoryFilters {...defaultProps} />);

    expect(screen.getByLabelText('Filter by epic')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search stories by title...')).toBeInTheDocument();
  });

  it('calls onSearchTermChange when search input changes', async () => {
    const onSearchTermChange = vi.fn();
    const user = userEvent.setup();

    render(<StoryFilters {...defaultProps} onSearchTermChange={onSearchTermChange} />);

    const searchInput = screen.getByPlaceholderText('Search stories by title...');
    await user.type(searchInput, 'test');

    // Verify the handler was called (should be called for each character)
    expect(onSearchTermChange).toHaveBeenCalled();
    expect(onSearchTermChange.mock.calls.length).toBeGreaterThan(0);
  });

  it('displays clear filters button when filters are active', () => {
    render(<StoryFilters {...defaultProps} epicFilter={1} searchTerm="test" />);

    expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument();
  });

  it('does not display clear filters button when no filters are active', () => {
    render(<StoryFilters {...defaultProps} />);

    expect(screen.queryByLabelText('Clear all filters')).not.toBeInTheDocument();
  });

  it('clears both filters when clear button is clicked', async () => {
    const onEpicFilterChange = vi.fn();
    const onSearchTermChange = vi.fn();
    const user = userEvent.setup();

    render(
      <StoryFilters
        {...defaultProps}
        epicFilter={1}
        searchTerm="test"
        onEpicFilterChange={onEpicFilterChange}
        onSearchTermChange={onSearchTermChange}
      />
    );

    const clearButton = screen.getByLabelText('Clear all filters');
    await user.click(clearButton);

    expect(onEpicFilterChange).toHaveBeenCalledWith(null);
    expect(onSearchTermChange).toHaveBeenCalledWith('');
  });

  it('renders epic filter dropdown', () => {
    render(<StoryFilters {...defaultProps} />);

    // Just verify the select trigger is rendered with correct aria-label
    const select = screen.getByLabelText('Filter by epic');
    expect(select).toBeInTheDocument();
    expect(select).toHaveAttribute('role', 'combobox');
  });

  it('displays search icon in search input', () => {
    const { container } = render(<StoryFilters {...defaultProps} />);

    // Check for SVG search icon
    const searchIcon = container.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });
});

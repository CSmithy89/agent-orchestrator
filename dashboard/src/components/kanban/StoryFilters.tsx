import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { X, Search } from 'lucide-react';

interface StoryFiltersProps {
  epicFilter: number | null;
  searchTerm: string;
  onEpicFilterChange: (epic: number | null) => void;
  onSearchTermChange: (term: string) => void;
  availableEpics: number[];
}

/**
 * Story filters component for Kanban board
 * - Epic dropdown filter
 * - Search input for story title
 * - Clear filters button
 */
export function StoryFilters({
  epicFilter,
  searchTerm,
  onEpicFilterChange,
  onSearchTermChange,
  availableEpics,
}: StoryFiltersProps) {
  const hasActiveFilters = epicFilter !== null || searchTerm.length > 0;

  const handleClearFilters = () => {
    onEpicFilterChange(null);
    onSearchTermChange('');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Epic Filter */}
      <div className="flex-1 max-w-xs">
        <Select
          value={epicFilter?.toString() || 'all'}
          onValueChange={(value) => {
            if (value === 'all') {
              onEpicFilterChange(null);
            } else {
              onEpicFilterChange(parseInt(value, 10));
            }
          }}
        >
          <SelectTrigger aria-label="Filter by epic">
            <SelectValue placeholder="All Epics" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Epics</SelectItem>
            {availableEpics.map((epic) => (
              <SelectItem key={epic} value={epic.toString()}>
                Epic {epic}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search Input */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search stories by title..."
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          className="pl-10"
          aria-label="Search stories by title"
        />
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="default"
          onClick={handleClearFilters}
          aria-label="Clear all filters"
          className="whitespace-nowrap"
        >
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}

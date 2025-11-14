import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Search, ArrowUpDown } from 'lucide-react';
import type { Project } from '../../api/types';

interface ProjectFiltersProps {
  onFilterChange: (filters: ProjectFilterState) => void;
}

export interface ProjectFilterState {
  phase: string;
  status: string;
  search: string;
  sortBy: 'lastUpdated' | 'name';
}

export function ProjectFilters({ onFilterChange }: ProjectFiltersProps) {
  const [filters, setFilters] = useState<ProjectFilterState>({
    phase: 'all',
    status: 'all',
    search: '',
    sortBy: 'lastUpdated',
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange(filters);
    }, 500);

    return () => clearTimeout(timer);
  }, [filters, onFilterChange]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handlePhaseChange = (value: string) => {
    setFilters((prev) => ({ ...prev, phase: value }));
  };

  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const toggleSort = () => {
    setFilters((prev) => ({
      ...prev,
      sortBy: prev.sortBy === 'lastUpdated' ? 'name' : 'lastUpdated',
    }));
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* Search input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
          aria-label="Search projects by name"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {/* Phase filter */}
        <Select value={filters.phase} onValueChange={handlePhaseChange}>
          <SelectTrigger className="w-[140px]" aria-label="Filter by phase">
            <SelectValue placeholder="All phases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All phases</SelectItem>
            <SelectItem value="analysis">Analysis</SelectItem>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="solutioning">Solutioning</SelectItem>
            <SelectItem value="implementation">Implementation</SelectItem>
            <SelectItem value="review">Review</SelectItem>
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[140px]" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort toggle */}
        <Button
          variant="outline"
          onClick={toggleSort}
          className="gap-2"
          aria-label={`Sort by: ${filters.sortBy === 'lastUpdated' ? 'Last Updated' : 'Name'}`}
        >
          <ArrowUpDown className="h-4 w-4" />
          {filters.sortBy === 'lastUpdated' ? 'Last Updated' : 'Name'}
        </Button>
      </div>
    </div>
  );
}

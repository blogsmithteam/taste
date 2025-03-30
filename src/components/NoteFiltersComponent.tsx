import React from 'react';
import { Button } from './auth/shared/Button';

interface NoteFiltersComponentProps {
  filters: {
    search?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: string;
  };
  onFiltersChange: (key: string, value: any) => void;
  onReset: () => void;
  availableTags: string[];
}

const NoteFiltersComponent: React.FC<NoteFiltersComponentProps> = ({
  filters,
  onFiltersChange: handleFilterChange,
  onReset,
  availableTags,
}) => {
  return (
    <div>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="search" className="block text-sm font-medium text-[#E76F51]/70 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full rounded-lg border border-[#E76F51]/10 bg-white/50 px-4 py-2 focus:border-[#E76F51] focus:outline-none focus:ring-1 focus:ring-[#E76F51] text-[#E76F51]"
            placeholder="Search notes..."
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="tags" className="block text-sm font-medium text-[#E76F51]/70 mb-1">
            Tags
          </label>
          <select
            id="tags"
            multiple
            value={filters.tags || []}
            onChange={(e) => handleFilterChange('tags', Array.from(e.target.selectedOptions, option => option.value))}
            className="w-full rounded-lg border border-[#E76F51]/10 bg-white/50 px-4 py-2 focus:border-[#E76F51] focus:outline-none focus:ring-1 focus:ring-[#E76F51] text-[#E76F51]"
          >
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="sortBy" className="block text-sm font-medium text-[#E76F51]/70 mb-1">
            Sort By
          </label>
          <select
            id="sortBy"
            value={filters.sortBy || 'createdAt'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full rounded-lg border border-[#E76F51]/10 bg-white/50 px-4 py-2 focus:border-[#E76F51] focus:outline-none focus:ring-1 focus:ring-[#E76F51] text-[#E76F51]"
          >
            <option value="createdAt">Date Created</option>
            <option value="title">Title</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label htmlFor="sortOrder" className="block text-sm font-medium text-[#E76F51]/70 mb-1">
            Sort Order
          </label>
          <select
            id="sortOrder"
            value={filters.sortOrder || 'desc'}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="w-full rounded-lg border border-[#E76F51]/10 bg-white/50 px-4 py-2 focus:border-[#E76F51] focus:outline-none focus:ring-1 focus:ring-[#E76F51] text-[#E76F51]"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <Button
          onClick={onReset}
          variant="secondary"
          className="bg-[#E76F51]/10 text-[#E76F51] hover:bg-[#E76F51] hover:text-white transition-colors"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

export default NoteFiltersComponent; 
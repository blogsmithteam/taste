import React from 'react';
import { NoteFilters } from '../../services/notes';
import { FormInput } from '../auth/shared/FormInput';
import { Button } from '../auth/shared/Button';
import { FoodRating } from '../shared/FoodRating';
import { Checkbox } from '../auth/shared/Checkbox';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface NoteFiltersProps {
  filters: NoteFilters;
  onFiltersChange: (filters: NoteFilters) => void;
  onReset: () => void;
}

export const NoteFiltersComponent: React.FC<NoteFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
}) => {
  const handleChange = (
    name: keyof NoteFilters,
    value: string | number | boolean | Date | string[] | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [name]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Type Tabs with integrated search */}
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by title or notes..."
            value={filters.searchTerm || ''}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="flex rounded-lg shadow-sm bg-white p-1 border border-gray-200 flex-1">
          <button
            onClick={() => handleChange('type', undefined)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
              !filters.type ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleChange('type', 'restaurant')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
              filters.type === 'restaurant' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => handleChange('type', 'recipe')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
              filters.type === 'recipe' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Recipes
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="w-40">
          <FormInput
            label="From"
            type="date"
            value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
          />
        </div>

        <div className="w-40">
          <FormInput
            label="To"
            type="date"
            value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rating
          </label>
          <FoodRating
            value={filters.rating || 0}
            onChange={(value) => handleChange('rating', value || undefined)}
            allowClear
          />
        </div>

        <div className="flex items-center">
          <Checkbox
            label="Would Order Again"
            checked={filters.wouldOrderAgain || false}
            onChange={(e) => handleChange('wouldOrderAgain', e.target.checked)}
          />
        </div>

        <Button variant="secondary" onClick={onReset} className="ml-auto">
          Reset
        </Button>
      </div>
    </div>
  );
}; 
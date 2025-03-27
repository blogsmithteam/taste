import React from 'react';
import { NoteFilters } from '../../services/notes';
import { FormInput } from '../auth/shared/FormInput';
import { Button } from '../auth/shared/Button';
import { FoodRating } from '../shared/FoodRating';
import { Checkbox } from '../auth/shared/Checkbox';
import { Autocomplete } from '../shared/Autocomplete';

interface NoteFiltersProps {
  filters: NoteFilters;
  onFiltersChange: (filters: NoteFilters) => void;
  onReset: () => void;
  availableTags?: string[];
}

export const NoteFiltersComponent: React.FC<NoteFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  availableTags = [],
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

  const handleTagSelect = (tag: string) => {
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tag)) {
      handleChange('tags', [...currentTags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = filters.tags || [];
    handleChange('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  const searchTags = async (searchTerm: string): Promise<string[]> => {
    return availableTags.filter(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleChange('type', e.target.value || undefined)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Types</option>
            <option value="restaurant">Restaurant</option>
            <option value="recipe">Recipe</option>
          </select>
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

        <div>
          <FormInput
            label="Date From"
            type="date"
            value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
          />
        </div>

        <div>
          <FormInput
            label="Date To"
            type="date"
            value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
          />
        </div>

        <div>
          <Checkbox
            label="Would Order Again"
            checked={filters.wouldOrderAgain || false}
            onChange={(e) => handleChange('wouldOrderAgain', e.target.checked)}
          />
        </div>

        <div>
          <FormInput
            label="Search"
            type="text"
            placeholder="Search by title or notes..."
            value={filters.searchTerm || ''}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
          />
        </div>

        <div className="lg:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </label>
          <div className="space-y-2">
            <Autocomplete
              label=""
              value=""
              onChange={() => {}}
              onSelect={(item) => handleTagSelect(item.name)}
              searchFunction={async (term) => {
                const tags = await searchTags(term);
                return tags.map(tag => ({ name: tag }));
              }}
              placeholder="Search tags..."
              allowNew
              newItemLabel="Add new tag"
            />
            {(filters.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.tags?.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none focus:bg-blue-500 focus:text-white"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4 space-x-2">
        <Button variant="secondary" onClick={onReset}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
}; 
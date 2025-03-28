import React from 'react';
import { DIETARY_PREFERENCES_OPTIONS } from '../../types/user';

interface DietaryPreferencesProps {
  selectedPreferences: string[];
  onChange: (preferences: string[]) => void;
  error?: string;
}

export const DietaryPreferences: React.FC<DietaryPreferencesProps> = ({
  selectedPreferences,
  onChange,
  error
}) => {
  const handlePreferenceToggle = (preference: string) => {
    const newPreferences = selectedPreferences.includes(preference)
      ? selectedPreferences.filter(p => p !== preference)
      : [...selectedPreferences, preference];
    onChange(newPreferences);
  };

  // Tooltip content for each preference
  const tooltips: Record<string, string> = {
    'Vegetarian': 'No meat, but may include dairy and eggs',
    'Vegan': 'No animal products whatsoever',
    'Pescatarian': 'No meat except fish and seafood',
    'Gluten-Free': 'No wheat, barley, rye, or their derivatives',
    'Dairy-Free': 'No milk products or their derivatives',
    'Kosher': 'Follows Jewish dietary laws',
    'Halal': 'Follows Islamic dietary laws',
    'Keto': 'High-fat, low-carb diet',
    'Paleo': 'Based on foods presumed eaten during the Paleolithic era',
    'Low-Carb': 'Reduced carbohydrate intake',
    'Low-Fat': 'Reduced fat intake',
    'Other': 'Other dietary preferences not listed'
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Dietary Preferences
      </label>
      <p className="text-sm text-gray-500 mb-3">
        Select all that apply to you. This helps personalize your experience.
      </p>
      <div className="flex flex-wrap gap-2">
        {DIETARY_PREFERENCES_OPTIONS.map(preference => (
          <button
            key={preference}
            type="button"
            onClick={() => handlePreferenceToggle(preference)}
            className={`
              relative group rounded-full px-4 py-2 text-sm font-medium 
              transition-colors duration-200 ease-in-out
              ${selectedPreferences.includes(preference)
                ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }
            `}
            title={tooltips[preference]}
          >
            {preference}
            <span className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-xs text-white bg-gray-900 rounded-md whitespace-nowrap">
              {tooltips[preference]}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 
import React, { useState } from 'react';

// Common food allergens based on FDA guidelines
const COMMON_ALLERGENS = [
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Tree nuts',
  'Peanuts',
  'Wheat',
  'Soybeans',
  'Sesame'
];

interface AllergiesProps {
  selectedAllergies: string[];
  onChange: (allergies: string[]) => void;
  error?: string;
}

export const Allergies: React.FC<AllergiesProps> = ({
  selectedAllergies,
  onChange,
  error
}) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Show suggestions based on input
    if (value.trim()) {
      const filtered = COMMON_ALLERGENS.filter(
        allergen => 
          allergen.toLowerCase().includes(value.toLowerCase()) &&
          !selectedAllergies.includes(allergen)
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addAllergy(inputValue.trim());
    }
  };

  const addAllergy = (allergy: string) => {
    const formattedAllergy = allergy.charAt(0).toUpperCase() + allergy.slice(1).toLowerCase();
    if (!selectedAllergies.includes(formattedAllergy)) {
      onChange([...selectedAllergies, formattedAllergy]);
    }
    setInputValue('');
    setSuggestions([]);
  };

  const removeAllergy = (allergy: string) => {
    onChange(selectedAllergies.filter(a => a !== allergy));
  };

  const toggleAllergy = (allergy: string) => {
    if (selectedAllergies.includes(allergy)) {
      removeAllergy(allergy);
    } else {
      addAllergy(allergy);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Allergies & Food Sensitivities
      </label>
      <p className="text-sm text-gray-500 mb-3">
        Add any food allergies or sensitivities. This helps personalize your experience and filter out unsuitable recommendations.
      </p>
      
      {/* Common allergens */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Common allergens:</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_ALLERGENS.map(allergen => {
            const isSelected = selectedAllergies.includes(allergen);
            return (
              <button
                key={allergen}
                type="button"
                onClick={() => toggleAllergy(allergen)}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm
                          transition-colors duration-200
                          ${isSelected 
                            ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                {isSelected ? '✓' : '+'} {allergen}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom allergies */}
      {selectedAllergies.some(allergy => !COMMON_ALLERGENS.includes(allergy)) && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedAllergies
            .filter(allergy => !COMMON_ALLERGENS.includes(allergy))
            .map(allergy => (
              <span
                key={allergy}
                className="inline-flex items-center rounded-full bg-red-100 px-3 py-1
                         text-sm font-medium text-red-800"
              >
                {allergy}
                <button
                  type="button"
                  onClick={() => removeAllergy(allergy)}
                  className="ml-1 inline-flex h-4 w-4 items-center justify-center
                           rounded-full hover:bg-red-200"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type and press Enter to add custom allergy"
          className="block w-full rounded-md border border-gray-300 px-3 py-2
                   text-gray-900 shadow-sm focus:border-indigo-500
                   focus:ring-indigo-500 sm:text-sm"
        />
        
        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
            <ul className="max-h-60 overflow-auto rounded-md py-1 text-base">
              {suggestions.map(suggestion => (
                <li
                  key={suggestion}
                  onClick={() => addAllergy(suggestion)}
                  className="cursor-pointer px-3 py-2 hover:bg-gray-100"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 
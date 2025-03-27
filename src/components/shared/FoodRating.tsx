import React from 'react';

interface FoodRatingProps {
  value: number;
  onChange: (value: number) => void;
  error?: string;
}

const RATING_EMOJIS = [
  { value: 1, emoji: '🤢', label: 'Not good' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '😋', label: 'Good' },
  { value: 4, emoji: '🤤', label: 'Very good' },
  { value: 5, emoji: '🤯', label: 'Amazing' },
];

export const FoodRating: React.FC<FoodRatingProps> = ({ value, onChange, error }) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Rating
      </label>
      <div className="flex items-center space-x-2">
        {RATING_EMOJIS.map(({ value: ratingValue, emoji, label }) => (
          <button
            key={ratingValue}
            type="button"
            onClick={() => onChange(ratingValue)}
            className={`text-2xl transition-transform hover:scale-110 focus:outline-none ${
              value >= ratingValue ? 'opacity-100' : 'opacity-40'
            }`}
            aria-label={`Rate ${ratingValue} out of 5: ${label}`}
          >
            {emoji}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}; 
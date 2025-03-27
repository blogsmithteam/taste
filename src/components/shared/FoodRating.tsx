import React from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

export interface FoodRatingProps {
  value: number;
  onChange?: (value: number) => void;
  error?: string;
  readonly?: boolean;
  allowClear?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const FoodRating: React.FC<FoodRatingProps> = ({
  value,
  onChange,
  error,
  readonly = false,
  allowClear = false,
  size = 'md'
}) => {
  const handleClick = (rating: number) => {
    if (readonly) return;
    if (allowClear && rating === value) {
      onChange?.(0);
    } else {
      onChange?.(rating);
    }
  };

  const getStarSize = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      default:
        return 'h-6 w-6';
    }
  };

  const starSize = getStarSize();

  return (
    <div>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            className={`${readonly ? 'cursor-default' : 'cursor-pointer'}`}
            disabled={readonly}
          >
            {rating <= value ? (
              <StarIcon className={`${starSize} text-yellow-400`} />
            ) : (
              <StarOutlineIcon className={`${starSize} text-gray-300`} />
            )}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}; 
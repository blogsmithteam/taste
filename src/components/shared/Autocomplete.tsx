import React, { useState, useEffect, useRef } from 'react';
import { FormInput } from '../auth/shared/FormInput';

interface AutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: any) => void;
  searchFunction: (term: string) => Promise<any[]>;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  allowNew?: boolean;
  newItemLabel?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  label,
  value,
  onChange,
  onSelect,
  searchFunction,
  placeholder,
  error,
  required = false,
  className,
  allowNew = false,
  newItemLabel = 'Add new',
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const search = async () => {
      if (!value.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchFunction(value);
        setSuggestions(results);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => clearTimeout(debounceTimer);
  }, [value, searchFunction]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (item: any) => {
    onSelect(item);
    setIsOpen(false);
  };

  const handleAddNew = () => {
    onSelect({ name: value.trim() });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <FormInput
        label={label}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        error={error}
        required={required}
        className={className}
      />

      {isOpen && (value.trim() || isLoading) && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1 overflow-auto text-base max-h-60">
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelect(item)}
                >
                  {item.name}
                </li>
              ))}
            </ul>
          ) : allowNew && value.trim() ? (
            <div
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-blue-600"
              onClick={handleAddNew}
            >
              {newItemLabel} "{value.trim()}"
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}; 
import React from 'react';
import clsx from 'clsx';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string | React.ReactNode;
  error?: string;
  required?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  required = false,
  className,
  id,
  ...props
}) => {
  const checkboxId = id || `checkbox-${typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : 'input'}`;

  return (
    <div className="relative flex items-start">
      <div className="flex items-center h-5">
        <input
          id={checkboxId}
          type="checkbox"
          className={clsx(
            'focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded',
            error && 'border-red-300 text-red-600 focus:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${checkboxId}-error` : undefined}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label
          htmlFor={checkboxId}
          className={clsx(
            'font-medium',
            error ? 'text-red-700' : 'text-gray-700'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${checkboxId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}; 
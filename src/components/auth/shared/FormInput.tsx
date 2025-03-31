import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

interface BaseFormInputProps {
  label: string;
  error?: string;
  required?: boolean;
  helperText?: string;
  type?: string;
  className?: string;
  id?: string;
}

interface InputFormProps extends BaseFormInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: string; // Redefine to make optional
}

interface TextareaFormProps extends BaseFormInputProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  type: 'textarea';
}

type FormInputProps = InputFormProps | TextareaFormProps;

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  required = false,
  className,
  id,
  helperText,
  type = 'text',
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const isTextarea = type === 'textarea';
  
  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="block text-base font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {isTextarea ? (
          <textarea
            id={inputId}
            className={clsx(
              'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
              error && 'border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            className={clsx(
              'block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
              error && 'border-red-300 pr-10 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {error && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500" id={`${inputId}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  );
}; 
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user';
import { ProfileFormData, DIETARY_PREFERENCES_OPTIONS, DEFAULT_USER_SETTINGS } from '../../types/user';
import { DietaryPreferences } from './DietaryPreferences';
import { Allergies } from './Allergies';
import { PrivacySettings } from './PrivacySettings';

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>;
  onSuccess?: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    bio: '',
    dietaryPreferences: [],
    allergies: [],
    settings: DEFAULT_USER_SETTINGS,
    ...initialData
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const target = e.target as HTMLInputElement;

    if (target.type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [name]: target.checked
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePreferenceToggle = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      dietaryPreferences: prev.dietaryPreferences.includes(preference)
        ? prev.dietaryPreferences.filter(p => p !== preference)
        : [...prev.dietaryPreferences, preference]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }

    if (formData.dietaryPreferences.length > 0) {
      const invalidPreferences = formData.dietaryPreferences.filter(
        pref => !DIETARY_PREFERENCES_OPTIONS.includes(pref)
      );
      if (invalidPreferences.length > 0) {
        newErrors.dietaryPreferences = 'Some dietary preferences are invalid';
      }
    }

    // Add validation for allergies
    if (formData.allergies.length > 50) {
      newErrors.allergies = 'Maximum of 50 allergies allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    if (!validateForm() || !user) {
      return;
    }

    setIsLoading(true);
    try {
      // Update profile data
      await userService.updateUserProfile(user.uid, formData);
      
      setSuccessMessage('Profile updated successfully!');
      onSuccess?.();
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border ${
            errors.username ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          value={formData.bio}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border ${
            errors.bio ? 'border-red-300' : 'border-gray-300'
          } px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
        />
        <p className="mt-1 text-sm text-gray-500">
          {formData.bio.length}/500 characters
        </p>
        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
      </div>

      {/* Dietary Preferences */}
      <div>
        <DietaryPreferences
          selectedPreferences={formData.dietaryPreferences}
          onChange={(preferences) => setFormData(prev => ({ ...prev, dietaryPreferences: preferences }))}
          error={errors.dietaryPreferences}
        />
      </div>

      {/* Replace the old allergies section with the new component */}
      <Allergies
        selectedAllergies={formData.allergies}
        onChange={(allergies) => setFormData(prev => ({ ...prev, allergies }))}
        error={errors.allergies}
      />

      {/* Replace the old settings section with the new PrivacySettings component */}
      <div className="space-y-4">
        <PrivacySettings
          settings={formData.settings}
          onChange={(newSettings) => setFormData(prev => ({ ...prev, settings: newSettings }))}
        />
      </div>

      {/* Error and Success Messages */}
      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  );
}; 
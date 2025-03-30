import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user';
import { ProfileFormData, DIETARY_PREFERENCES_OPTIONS, DEFAULT_USER_SETTINGS } from '../../types/user';
import { DietaryPreferences } from './DietaryPreferences';
import { Allergies } from './Allergies';
import { PrivacySettings } from './PrivacySettings';
import { LinkIcon } from '@heroicons/react/24/outline';
import { ProfilePhotoUpload } from './ProfilePhotoUpload';

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
    email: '',
    bio: '',
    photoURL: '',
    dietaryPreferences: [],
    allergies: [],
    settings: DEFAULT_USER_SETTINGS,
    ...initialData
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleCopyProfileLink = async () => {
    if (!user) return;
    const profileUrl = `${window.location.origin}/app/users/${user.uid}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy profile link:', err);
    }
  };

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
    setFormData(prev => {
      const currentPreferences = prev.dietaryPreferences || [];
      return {
        ...prev,
        dietaryPreferences: currentPreferences.includes(preference)
          ? currentPreferences.filter(p => p !== preference)
          : [...currentPreferences, preference]
      };
    });
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

    const preferences = formData.dietaryPreferences || [];
    if (preferences.length > 0) {
      const invalidPreferences = preferences.filter(
        pref => !DIETARY_PREFERENCES_OPTIONS.includes(pref)
      );
      if (invalidPreferences.length > 0) {
        newErrors.dietaryPreferences = 'Some dietary preferences are invalid';
      }
    }

    const allergies = formData.allergies || [];
    if (allergies.length > 50) {
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

  const handlePhotoUploadComplete = (photoURL: string) => {
    setFormData(prev => ({ ...prev, photoURL }));
    setSuccessMessage('Profile photo updated successfully!');
  };

  const handlePhotoUploadError = (error: Error) => {
    setSubmitError(error.message);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* Profile Photo Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
        <div className="p-8">
          <h2>Profile Photo</h2>
          <div className="mt-6">
            <ProfilePhotoUpload
              currentPhotoURL={formData.photoURL}
              onUploadComplete={handlePhotoUploadComplete}
              onError={handlePhotoUploadError}
            />
          </div>
        </div>
      </div>

      {/* Profile Information Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
        <div className="p-8">
          <h2>Basic Information</h2>
          <div className="mt-6 space-y-6">
            {/* Username */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <button
                  type="button"
                  onClick={handleCopyProfileLink}
                  className="btn-secondary inline-flex items-center"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Share Profile
                </button>
              </div>
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
                value={formData.bio || ''}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border ${
                  errors.bio ? 'border-red-300' : 'border-gray-300'
                } px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm`}
              />
              <p className="mt-1 text-sm text-gray-500">
                {(formData.bio || '').length}/500 characters
              </p>
              {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Dietary Preferences Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
        <div className="p-8">
          <h2>Dietary Preferences</h2>
          <div className="mt-6">
            <DietaryPreferences
              selectedPreferences={formData.dietaryPreferences || []}
              onChange={(preferences) => setFormData(prev => ({ ...prev, dietaryPreferences: preferences }))}
              error={errors.dietaryPreferences}
            />
          </div>
        </div>
      </div>

      {/* Allergies Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
        <div className="p-8">
          <h2>Allergies</h2>
          <div className="mt-6">
            <Allergies
              selectedAllergies={formData.allergies || []}
              onChange={(allergies) => setFormData(prev => ({ ...prev, allergies }))}
              error={errors.allergies}
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
        <div className="p-8">
          <h2>Privacy Settings</h2>
          <div className="mt-6">
            <PrivacySettings
              settings={formData.settings}
              onChange={(newSettings) => setFormData(prev => ({ ...prev, settings: newSettings }))}
            />
          </div>
        </div>
      </div>

      {/* Toast notification for copied link */}
      {showCopiedToast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg">
          Profile link copied to clipboard!
        </div>
      )}

      {/* Error and Success Messages */}
      {submitError && (
        <div className="rounded-xl bg-red-50 p-6 mt-8">
          <p className="text-sm text-red-700">{submitError}</p>
        </div>
      )}
      {successMessage && (
        <div className="rounded-xl bg-green-50 p-6 mt-8">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end mt-8">
        <button
          type="submit"
          disabled={isLoading}
          className={`btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}; 
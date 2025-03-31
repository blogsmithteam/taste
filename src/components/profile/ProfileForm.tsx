import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user';
import { ProfileFormData, DIETARY_PREFERENCES_OPTIONS, DEFAULT_USER_SETTINGS } from '../../types/user';
import { DietaryPreferences } from './DietaryPreferences';
import { Allergies } from './Allergies';
import { PrivacySettings } from './PrivacySettings';
import { LinkIcon } from '@heroicons/react/24/outline';

interface ProfileFormProps {
  initialData?: Partial<ProfileFormData>;
  onSuccess?: () => void;
}

interface FormErrors {
  [key: string]: string;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ initialData, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<ProfileFormData>>({
    username: '',
    bio: '',
    dietaryPreferences: [],
    allergies: [],
    settings: {
      isPrivate: false,
      emailNotifications: true,
    },
    ...initialData,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle dietary preferences changes
  const handleDietaryPreferencesChange = (preferences: string[]) => {
    setFormData(prev => ({ ...prev, dietaryPreferences: preferences }));
  };

  // Handle allergies changes
  const handleAllergiesChange = (allergies: string[]) => {
    setFormData(prev => ({ ...prev, allergies }));
  };

  // Handle privacy settings changes
  const handlePrivacySettingsChange = (settings: { isPrivate: boolean; emailNotifications: boolean }) => {
    setFormData(prev => ({ ...prev, settings }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    if (!user) {
      setSubmitError('You must be logged in to update your profile');
      setIsSubmitting(false);
      return;
    }

    try {
      await userService.updateUserProfile(user.uid, formData);
      setSuccessMessage('Profile updated successfully!');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      setSubmitError('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {/* Profile Information Section */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
        <div className="p-8">
          <h2>Profile Information</h2>
          
          <div className="mt-6 space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="username"
                  id="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-taste-primary focus:border-taste-primary block w-full sm:text-sm border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            {/* Bio Field */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <div className="mt-1">
                <textarea
                  name="bio"
                  id="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="shadow-sm focus:ring-taste-primary focus:border-taste-primary block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Briefly describe yourself and your food preferences.
              </p>
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
              onChange={handleDietaryPreferencesChange}
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
              onChange={handleAllergiesChange}
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
              settings={{
                isPrivate: formData.settings?.isPrivate || false,
                emailNotifications: formData.settings?.emailNotifications || true,
              }}
              onChange={handlePrivacySettingsChange}
            />
          </div>
        </div>
      </div>
      
      {/* Form Submission */}
      <div className="flex items-center justify-between">
        <div>
          {submitError && (
            <div className="text-red-600">{submitError}</div>
          )}
          {successMessage && (
            <div className="text-green-600">{successMessage}</div>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`
            btn-primary
            ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}
          `}
        >
          {isSubmitting ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}; 
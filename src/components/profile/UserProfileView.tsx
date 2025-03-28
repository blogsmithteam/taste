import React, { useEffect, useState } from 'react';
import { UserProfile } from '../../types/user';
import { userService } from '../../services/user';
import { FollowButton } from './FollowButton';

interface UserProfileViewProps {
  userId: string;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await userService.getUserProfile(userId);
        setProfile(userProfile);
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error || 'Profile not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Profile Header */}
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {profile.username}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {profile.bio || 'No bio provided'}
                </p>
              </div>
              <FollowButton targetUserId={userId} />
            </div>

            {/* Profile Details */}
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                {/* Dietary Preferences */}
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Dietary Preferences
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.dietaryPreferences.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.dietaryPreferences.map((pref) => (
                          <span
                            key={pref}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {pref}
                          </span>
                        ))}
                      </div>
                    ) : (
                      'None specified'
                    )}
                  </dd>
                </div>

                {/* Allergies */}
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Allergies</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.allergies.map((allergy) => (
                          <span
                            key={allergy}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    ) : (
                      'None specified'
                    )}
                  </dd>
                </div>

                {/* Followers & Following */}
                <div className="sm:col-span-2">
                  <div className="flex space-x-8">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Followers
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile.followers.length}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        Following
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {profile.following.length}
                      </dd>
                    </div>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
import React, { useEffect, useState } from 'react';
import { UserProfile } from '../../types/user';
import { userService } from '../../services/user';
import { FollowButton } from './FollowButton';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, LinkIcon } from '@heroicons/react/24/outline';

interface UserProfileViewProps {
  userId: string;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ userId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await userService.deleteUser(userId);
      navigate('/app/discover');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/app/users/${userId}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy profile link:', err);
    }
  };

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

  // Check if the current user is an admin (you can modify this condition based on your admin criteria)
  const isAdmin = user?.email === 'maddy@theblogsmith.com';

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {profile.profilePicture ? (
                <img
                  className="h-16 w-16 rounded-full"
                  src={profile.profilePicture}
                  alt={profile.username}
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-2xl">{profile.username[0].toUpperCase()}</span>
                </div>
              )}
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">{profile.username}</h2>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCopyProfileLink}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LinkIcon className="h-4 w-4 mr-1" />
                Share Profile
              </button>
              {isAdmin && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </button>
              )}
              <FollowButton targetUserId={userId} />
            </div>
          </div>
        </div>

        {/* Toast notification for copied link */}
        {showCopiedToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg">
            Profile link copied to clipboard!
          </div>
        )}

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="space-y-4">
            {profile.bio && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Bio</h3>
                <p className="mt-1 text-gray-500">{profile.bio}</p>
              </div>
            )}

            {profile.dietaryPreferences.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Dietary Preferences</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.dietaryPreferences.map((pref) => (
                    <span
                      key={pref}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile.allergies.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900">Allergies</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.allergies.map((allergy) => (
                    <span
                      key={allergy}
                      className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-500">
              <div>
                <span className="font-medium text-gray-900">{profile.followers.length}</span> followers
              </div>
              <div>
                <span className="font-medium text-gray-900">{profile.following.length}</span> following
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
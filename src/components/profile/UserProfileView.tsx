import React, { useEffect, useState } from 'react';
import { User } from '../../types/user';
import { userService } from '../../services/user';
import { FollowButton } from './FollowButton';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LinkIcon } from '@heroicons/react/24/outline';

interface UserProfileViewProps {
  userId: string;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ userId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

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

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!profile) return;
      
      try {
        setLoadingFollowers(true);
        const followersList = await userService.getFollowers(userId);
        setFollowers(followersList);
      } catch (err) {
        console.error('Error loading followers:', err);
      } finally {
        setLoadingFollowers(false);
      }
    };

    const fetchFollowing = async () => {
      if (!profile) return;
      
      try {
        setLoadingFollowing(true);
        const followingList = await userService.getFollowing(userId);
        setFollowing(followingList);
      } catch (err) {
        console.error('Error loading following:', err);
      } finally {
        setLoadingFollowing(false);
      }
    };

    fetchFollowers();
    fetchFollowing();
  }, [userId, profile]);

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

  const handleUserClick = (userId: string) => {
    navigate(`/app/users/${userId}`);
  };

  if (loading) {
    return (
      <div className="section-container">
        <div className="section-inner">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-taste-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="section-container">
        <div className="section-inner">
          <div className="bg-white/80 rounded-xl shadow-sm p-6">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error || 'Profile not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="section-inner">
        <div className="space-y-12">
          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {profile.photoURL ? (
                    <img
                      className="h-16 w-16 rounded-full"
                      src={profile.photoURL}
                      alt={profile.username}
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-2xl">{profile.username[0].toUpperCase()}</span>
                    </div>
                  )}
                  <div className="ml-4">
                    <h1>{profile.username}</h1>
                    <p className="text-gray-500">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleCopyProfileLink}
                    className="btn-secondary inline-flex items-center"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    Share Profile
                  </button>
                  <FollowButton targetUserId={userId} />
                </div>
              </div>

              {profile.bio && (
                <div className="mt-8">
                  <h2>Bio</h2>
                  <p className="descriptive-text mt-2">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dietary Preferences Section */}
          {profile.dietaryPreferences && profile.dietaryPreferences.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
              <div className="p-8">
                <h2>Dietary Preferences</h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {profile.dietaryPreferences.map((pref: string) => (
                    <span
                      key={pref}
                      className="tag-pill"
                    >
                      {pref}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Allergies Section */}
          {profile.allergies && profile.allergies.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
              <div className="p-8">
                <h2>Allergies</h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {profile.allergies.map((allergy: string) => (
                    <span
                      key={allergy}
                      className="tag-pill"
                    >
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Social Stats Section */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
            <div className="p-8">
              <h2>Social</h2>
              <div className="mt-6 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-2xl font-semibold text-taste-primary">{profile.followers?.length || 0}</p>
                  <p className="text-gray-500">Followers</p>
                  {followers.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {followers.slice(0, 3).map((follower) => (
                        <div
                          key={follower.id}
                          onClick={() => handleUserClick(follower.id)}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        >
                          {follower.photoURL ? (
                            <img
                              src={follower.photoURL}
                              alt={follower.username}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">{follower.username[0].toUpperCase()}</span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{follower.username}</span>
                        </div>
                      ))}
                      {followers.length > 3 && (
                        <button
                          onClick={() => navigate(`/app/users/${userId}/followers`)}
                          className="text-sm text-taste-primary hover:text-taste-primary-dark font-medium mt-2"
                        >
                          View all followers
                        </button>
                      )}
                    </div>
                  )}
                  {loadingFollowers && (
                    <div className="mt-4 flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-taste-primary"></div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-2xl font-semibold text-taste-primary">{profile.following?.length || 0}</p>
                  <p className="text-gray-500">Following</p>
                  {following.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {following.slice(0, 3).map((followedUser) => (
                        <div
                          key={followedUser.id}
                          onClick={() => handleUserClick(followedUser.id)}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        >
                          {followedUser.photoURL ? (
                            <img
                              src={followedUser.photoURL}
                              alt={followedUser.username}
                              className="h-8 w-8 rounded-full"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">{followedUser.username[0].toUpperCase()}</span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900">{followedUser.username}</span>
                        </div>
                      ))}
                      {following.length > 3 && (
                        <button
                          onClick={() => navigate(`/app/users/${userId}/following`)}
                          className="text-sm text-taste-primary hover:text-taste-primary-dark font-medium mt-2"
                        >
                          View all following
                        </button>
                      )}
                    </div>
                  )}
                  {loadingFollowing && (
                    <div className="mt-4 flex justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-taste-primary"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast notification for copied link */}
        {showCopiedToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg">
            Profile link copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
};
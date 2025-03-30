import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { User } from '../types/user';
import { UserCard } from '../components/users/UserCard';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const FollowingPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [following, setFollowing] = useState<User[]>([]);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const [userProfile, followingList] = await Promise.all([
          userService.getUserProfile(userId),
          userService.getFollowing(userId)
        ]);
        setProfile(userProfile);
        setFollowing(followingList);
      } catch (err) {
        setError('Failed to load following users. Please try again later.');
        console.error('Error fetching following users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleBack = () => {
    navigate(`/app/users/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF1ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-taste-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#FDF1ED]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          <div className="bg-white/80 rounded-lg shadow-sm border border-[#E76F51]/10 p-6">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error || 'Profile not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF1ED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="inline-flex items-center text-taste-primary hover:text-taste-primary/80 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Back to {profile.username}'s Profile</span>
          </button>
        </div>

        <div className="bg-white/80 rounded-lg shadow-sm border border-[#E76F51]/10 p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-5xl font-semibold text-[#E76F51] mb-2">
                Following
              </h1>
              <p className="text-xl text-black">
                {profile.username} follows {following.length} {following.length === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>

          {following.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-taste-primary">Not following anyone yet</h3>
              <p className="mt-2 text-sm text-taste-primary/70">
                When {profile.username} follows other users, they'll show up here.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {following.map(followedUser => (
                <UserCard 
                  key={followedUser.id} 
                  user={followedUser}
                  showFamilyBadge={followedUser.familyMembers?.includes(profile.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingPage; 
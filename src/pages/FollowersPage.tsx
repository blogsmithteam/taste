import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { User } from '../types/user';
import { UserCard } from '../components/users/UserCard';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const FollowersPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [followers, setFollowers] = useState<User[]>([]);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        const [userProfile, followersList] = await Promise.all([
          userService.getUserProfile(userId),
          userService.getFollowers(userId)
        ]);
        setProfile(userProfile);
        setFollowers(followersList);
      } catch (err) {
        setError('Failed to load followers. Please try again later.');
        console.error('Error fetching followers:', err);
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taste-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error || 'Profile not found'}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.username}'s Followers
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
          </p>
        </div>
      </div>

      {followers.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No followers yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            When people follow {profile.username}, they'll show up here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {followers.map(follower => (
            <UserCard key={follower.id} user={follower} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowersPage; 
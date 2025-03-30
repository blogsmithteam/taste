import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { User } from '../types/user';
import { UserCard } from '../components/users/UserCard';

const FriendsPage: React.FC = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const followingUsers = await userService.getFollowing(user.uid);
        setFriends(followingUsers);
      } catch (err) {
        setError('Failed to load friends. Please try again later.');
        console.error('Error fetching friends:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [user]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-taste-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
      </div>

      {friends.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No friends yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Start following other users to see them here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {friends.map(friend => (
            <UserCard key={friend.id} user={friend} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsPage; 
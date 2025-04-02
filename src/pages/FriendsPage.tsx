import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { User } from '../types/user';
import { UserCard } from '../components/users/UserCard';
import { UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { PendingFollowRequests } from '../components/profile/PendingFollowRequests';

const FriendsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequests, setShowRequests] = useState(location.state?.showRequests || false);

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

  const filteredFriends = searchQuery
    ? friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-taste-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 rounded-lg shadow-sm border border-red-100 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-5xl font-semibold text-taste-primary mb-2">
              Friends
            </h1>
            <p className="text-xl text-black">
              Connect and share with your tasting community
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowRequests(!showRequests)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                showRequests 
                  ? 'bg-taste-primary text-white hover:bg-taste-primary/90'
                  : 'bg-taste-primary/10 text-taste-primary hover:bg-taste-primary/20'
              }`}
            >
              Follow Requests
            </button>
            <button
              onClick={() => navigate('/app/discover')}
              className="inline-flex items-center px-4 py-2 bg-taste-primary text-white rounded-lg hover:bg-taste-primary/90 transition-colors"
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Discover Friends
            </button>
          </div>
        </div>

        {showRequests && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10 mb-8">
            <div className="p-8">
              <h2 className="font-serif text-2xl font-semibold text-[#E76F51] mb-6">
                Pending Follow Requests
              </h2>
              <PendingFollowRequests />
            </div>
          </div>
        )}

        <div className="p-6">
          <div className="relative mb-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-taste-primary/70" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full bg-white/80 rounded-lg border-taste-primary/10 pl-10 pr-3 py-2 text-sm placeholder:text-taste-primary/70 focus:border-taste-primary focus:ring-taste-primary"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredFriends.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-taste-primary/40" />
              <h3 className="mt-2 text-xl font-medium text-taste-primary">
                {searchQuery ? 'No friends found matching your search' : 'No friends yet'}
              </h3>
              <p className="mt-1 text-taste-primary/70">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start following other users to see them here.'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/app/discover')}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-taste-primary/10 text-taste-primary hover:bg-taste-primary hover:text-white transition-colors rounded-lg text-sm font-medium"
                >
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  Find Friends
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredFriends.map(friend => (
                <UserCard 
                  key={friend.id} 
                  user={friend}
                  showFamilyBadge={friend.familyMembers?.includes(user?.uid || '')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsPage; 
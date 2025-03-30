import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { User } from '../types/user';
import { UserCard } from '../components/users/UserCard';
import { MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const DiscoverUsers: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isAllFriendsMode = location.pathname === '/app/friends';

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        let fetchedUsers;
        
        if (isAllFriendsMode) {
          fetchedUsers = await userService.getFollowing(user.uid);
        } else {
          const allUsers = await userService.getAllUsers();
          fetchedUsers = allUsers.filter(u => u.id !== user.uid);
        }
        
        setUsers(fetchedUsers);
      } catch (err) {
        setError(isAllFriendsMode 
          ? 'Failed to load friends. Please try again later.'
          : 'Failed to load users. Please try again later.'
        );
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user, isAllFriendsMode]);

  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-taste-primary"></div>
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
              Discover Users
            </h1>
            <p className="text-xl text-black">
              Find and connect with fellow taste enthusiasts
            </p>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-white/80 rounded-lg shadow-sm border border-red-100 p-4">
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
          )}

          <div className="relative mb-6">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-taste-primary/70" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="block w-full bg-white/80 rounded-lg border-taste-primary/10 pl-10 pr-3 py-2 text-sm placeholder:text-taste-primary/70 focus:border-taste-primary focus:ring-taste-primary"
              placeholder="Search users by name or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-taste-primary/40" />
              <h3 className="mt-2 text-xl font-medium text-taste-primary">
                {searchQuery ? 'No users found matching your search' : 'No users found'}
              </h3>
              <p className="mt-1 text-taste-primary/70">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Check back later for more users to connect with.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map(discoveredUser => (
                <UserCard 
                  key={discoveredUser.id} 
                  user={discoveredUser}
                  showFamilyBadge={discoveredUser.familyMembers?.includes(user?.uid || '')}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverUsers; 
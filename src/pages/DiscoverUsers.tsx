import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { User } from '../types/user';
import { UserCard } from '../components/users/UserCard';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isAllFriendsMode ? 'All Friends' : 'Discover Users'}
        </h1>
      </div>

      <div className="relative mb-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
          placeholder={isAllFriendsMode ? "Search friends..." : "Search users..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">
            {searchQuery 
              ? 'No users found matching your search'
              : isAllFriendsMode
                ? 'No friends yet'
                : 'No users found'
            }
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {isAllFriendsMode
              ? 'Start following other users to see them here.'
              : 'Try adjusting your search or check back later.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map(user => (
            <UserCard 
              key={user.id} 
              user={user}
              showFamilyBadge={user.familyMembers?.includes(user.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoverUsers; 
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/user';
import { userService } from '../../services/user';
import { useAuth } from '../../contexts/AuthContext';
import { UserIcon } from '@heroicons/react/24/solid';

interface FriendSelectorProps {
  onSelect: (selectedFriends: UserProfile[]) => void;
  initialSelected?: string[];
}

export const FriendSelector: React.FC<FriendSelectorProps> = ({
  onSelect,
  initialSelected = [],
}) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelected));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadFriends = async () => {
      if (!user) return;

      try {
        const followingProfiles = await userService.getFollowingProfiles(user.uid);
        setFriends(followingProfiles);
      } catch (err) {
        console.error('Error loading friends:', err);
        setError('Failed to load friends');
      } finally {
        setLoading(false);
      }
    };

    loadFriends();
  }, [user]);

  const toggleFriend = (friend: UserProfile) => {
    const newSelectedIds = new Set(selectedIds);
    if (selectedIds.has(friend.uid)) {
      newSelectedIds.delete(friend.uid);
    } else {
      newSelectedIds.add(friend.uid);
    }
    setSelectedIds(newSelectedIds);
    onSelect(friends.filter(f => newSelectedIds.has(f.uid)));
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm py-2">{error}</div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Search friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      <div className="max-h-60 overflow-y-auto">
        {filteredFriends.length === 0 ? (
          <div className="text-gray-500 text-sm py-2 text-center">
            {friends.length === 0 ? "You're not following anyone yet" : "No matching friends found"}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFriends.map((friend) => (
              <div
                key={friend.uid}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-50 ${
                  selectedIds.has(friend.uid) ? 'bg-blue-50' : ''
                }`}
                onClick={() => toggleFriend(friend)}
              >
                <div className="flex items-center space-x-3">
                  {friend.profilePicture ? (
                    <img
                      src={friend.profilePicture}
                      alt={friend.username}
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {friend.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      {friend.email}
                    </div>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border ${
                  selectedIds.has(friend.uid)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedIds.has(friend.uid) && (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 
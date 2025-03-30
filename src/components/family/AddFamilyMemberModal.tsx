import React, { useState, useEffect } from 'react';
import { User } from '../../types/user';
import { userService } from '../../services/user';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { FirebaseError } from 'firebase/app';

interface AddFamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (userId: string) => Promise<void>;
  currentUserId: string;
}

export const AddFamilyMemberModal: React.FC<AddFamilyMemberModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  currentUserId
}) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUserId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        const [following, currentUser] = await Promise.all([
          userService.getFollowing(currentUserId),
          userService.getUserProfile(currentUserId)
        ]);
        
        if (!currentUser) {
          setError('Failed to load user profile. Please try again later.');
          return;
        }
        
        // Filter out users who are already family members (checking both sides of the relationship)
        const nonFamilyFriends = following.filter(friend => 
          !friend.familyMembers?.includes(currentUserId) && 
          !currentUser.familyMembers?.includes(friend.id)
        );
        setFriends(nonFamilyFriends);
      } catch (err) {
        setError('Failed to load friends. Please try again later.');
        console.error('Error fetching friends:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchFriends();
      setSelectedUserId(null);
      setSearchQuery('');
    }
  }, [isOpen, currentUserId]);

  const filteredFriends = searchQuery
    ? friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : friends;

  const handleAdd = async () => {
    if (!selectedUserId) return;
    
    try {
      setIsAdding(true);
      setError(null);
      setSuccess(null);
      
      const selectedFriend = friends.find(friend => friend.id === selectedUserId);
      await onAdd(selectedUserId);
      
      // If we get here, the operation was successful
      setSuccess(`Successfully added ${selectedFriend?.username || 'friend'} to your family.`);
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      if (err instanceof FirebaseError) {
        // Check if it's a permission error but the operation might have succeeded
        if (err.code === 'permission-denied') {
          // Verify if the operation actually succeeded by checking the family members
          try {
            const updatedUser = await userService.getUserProfile(currentUserId);
            if (updatedUser?.familyMembers?.includes(selectedUserId)) {
              const selectedFriend = friends.find(friend => friend.id === selectedUserId);
              setSuccess(`Successfully added ${selectedFriend?.username || 'friend'} to your family.`);
              setTimeout(() => {
                onClose();
              }, 1500);
              return;
            }
          } catch (verifyErr) {
            console.error('Error verifying family member status:', verifyErr);
          }
        }
      }
      
      setError('Failed to add family member. Please try again.');
      console.error('Error adding family member:', err);
    } finally {
      setIsAdding(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white/80 border border-taste-primary/10 px-4 pb-4 pt-5 text-left shadow-sm transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div>
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="font-serif text-2xl font-semibold text-taste-primary mb-4">
                Add Family Member
              </h3>

              <div className="relative mb-4">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-taste-primary/70" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="block w-full rounded-lg border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-taste-primary/10 placeholder:text-taste-primary/70 focus:ring-2 focus:ring-inset focus:ring-taste-primary sm:text-sm sm:leading-6"
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-4 mb-4 border border-red-100">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-50 p-4 mb-4 border border-green-100">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-taste-primary"></div>
                  </div>
                ) : filteredFriends.length === 0 ? (
                  <p className="text-center text-taste-primary/70 py-4">
                    {searchQuery 
                      ? 'No friends found matching your search'
                      : 'No friends available to add as family members'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredFriends.map(friend => (
                      <div
                        key={friend.id}
                        className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedUserId === friend.id
                            ? 'bg-taste-primary/10 border border-taste-primary/20'
                            : 'hover:bg-taste-primary/5'
                        }`}
                        onClick={() => setSelectedUserId(friend.id)}
                      >
                        <img
                          src={friend.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username)}&background=random`}
                          alt={friend.username}
                          className="h-10 w-10 rounded-full"
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{friend.username}</p>
                          {friend.bio && (
                            <p className="text-sm text-taste-primary/70 truncate">{friend.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-lg px-4 py-2 bg-taste-primary text-white hover:bg-taste-primary/90 transition-colors sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleAdd}
              disabled={!selectedUserId || isAdding || !!success}
            >
              {isAdding ? 'Adding...' : 'Add to Family'}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-lg px-4 py-2 bg-taste-primary/10 text-taste-primary hover:bg-taste-primary hover:text-white transition-colors sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 
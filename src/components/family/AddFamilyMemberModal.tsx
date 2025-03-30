import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { User } from '../../types/user';
import { userService } from '../../services/user';

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
  currentUserId,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const allUsers = await userService.getAllUsers();
        
        // Get current user's profile to check existing family members
        const currentUser = await userService.getUserProfile(currentUserId);
        if (!currentUser) throw new Error('Current user not found');

        // Filter out the current user and existing family members
        const filteredUsers = allUsers.filter(user => 
          user.id !== currentUserId && 
          !currentUser.familyMembers?.includes(user.id)
        );
        
        setUsers(filteredUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, currentUserId]);

  const handleAdd = async () => {
    if (!selectedUserId) return;

    try {
      setAddingUser(true);
      setError(null);
      await onAdd(selectedUserId);
      onClose();
    } catch (err) {
      setError('Failed to add family member');
    } finally {
      setAddingUser(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-xl max-w-md w-full mx-auto p-6 shadow-lg">
          <Dialog.Title className="text-lg font-medium mb-4">
            Add Family Member
          </Dialog.Title>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto mb-4">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-taste-primary"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {searchTerm ? 'No users found' : 'No users available'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer ${
                      selectedUserId === user.id
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'hover:bg-gray-50 border-transparent'
                    } border`}
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.username}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">
                          {user.username[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {user.username}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedUserId || addingUser}
              className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                (!selectedUserId || addingUser) && 'opacity-50 cursor-not-allowed'
              }`}
            >
              {addingUser ? 'Adding...' : 'Add Family Member'}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}; 
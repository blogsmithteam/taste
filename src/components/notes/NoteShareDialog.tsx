import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Note } from '../../types/notes';
import { UserProfile } from '../../types/user';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../auth/shared/Button';
import { FormInput } from '../auth/shared/FormInput';
import { FriendSelector } from './FriendSelector';

interface NoteShareDialogProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSharing: (visibility: Note['visibility'], sharedWith: string[]) => Promise<void>;
}

export const NoteShareDialog: React.FC<NoteShareDialogProps> = ({
  note,
  isOpen,
  onClose,
  onUpdateSharing,
}) => {
  const { user } = useAuth();
  const [visibility, setVisibility] = useState<Note['visibility']>(note.visibility);
  const [sharedWith, setSharedWith] = useState<string[]>(note.sharedWith || []);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFriendSelector, setShowFriendSelector] = useState(false);

  useEffect(() => {
    setVisibility(note.visibility);
    setSharedWith(note.sharedWith || []);
  }, [note]);

  const handleVisibilityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setVisibility(event.target.value as Note['visibility']);
  };

  const handleAddUser = async () => {
    if (!newEmail.trim()) return;
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (sharedWith.includes(newEmail)) {
      setError('This user is already added');
      return;
    }

    setSharedWith([...sharedWith, newEmail]);
    setNewEmail('');
    setError(null);
  };

  const handleRemoveUser = (email: string) => {
    setSharedWith(sharedWith.filter(e => e !== email));
  };

  const handleFriendSelect = (selectedFriends: UserProfile[]) => {
    const selectedEmails = selectedFriends.map(friend => friend.email);
    // Merge with existing emails, removing duplicates
    const newSharedWith = Array.from(new Set([...sharedWith, ...selectedEmails]));
    setSharedWith(newSharedWith);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onUpdateSharing(visibility, sharedWith);
      onClose();
    } catch (error) {
      setError('Failed to update sharing settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">
              Share Note
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Visibility Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibility
              </label>
              <select
                value={visibility}
                onChange={handleVisibilityChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="private">Private</option>
                <option value="friends">Friends</option>
                <option value="public">Public</option>
              </select>
            </div>

            {/* Share with specific users */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Share with specific users
                </label>
                <button
                  onClick={() => setShowFriendSelector(!showFriendSelector)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {showFriendSelector ? 'Hide friend list' : 'Choose from friends'}
                </button>
              </div>

              {showFriendSelector && (
                <div className="mb-4">
                  <FriendSelector
                    onSelect={handleFriendSelect}
                    initialSelected={sharedWith}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <FormInput
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1"
                  label="Email address"
                />
                <Button
                  onClick={handleAddUser}
                  variant="secondary"
                  className="whitespace-nowrap"
                >
                  <UserPlusIcon className="h-5 w-5 mr-1" />
                  Add User
                </Button>
              </div>
              {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
              )}
            </div>

            {/* Shared Users List */}
            {sharedWith.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Shared with:
                </h3>
                <ul className="space-y-2">
                  {sharedWith.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md"
                    >
                      <span className="text-sm text-gray-700">{email}</span>
                      <button
                        onClick={() => handleRemoveUser(email)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={onClose}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                isLoading={isLoading}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 
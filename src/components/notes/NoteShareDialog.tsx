import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Note } from '../../types/notes';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../auth/shared/Button';

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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setVisibility(note.visibility);
  }, [note]);

  const handleVisibilityChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setVisibility(event.target.value as Note['visibility']);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onUpdateSharing(visibility, []);
      onClose();
    } catch (error) {
      console.error('Error in handleSave:', error);
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
        <Dialog.Panel className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              Share Note
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who can see this note?
              </label>
              <select
                value={visibility}
                onChange={handleVisibilityChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="private">Only me</option>
                <option value="friends">My friends</option>
                <option value="public">Everyone</option>
              </select>
              <p className="mt-2 text-sm text-gray-500">
                {visibility === 'private' && 'Only you will be able to see this note'}
                {visibility === 'friends' && 'Your friends will be able to see this note'}
                {visibility === 'public' && 'Anyone can see this note'}
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
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
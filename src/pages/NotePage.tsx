import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import NoteView from '../components/notes/NoteView';
import { Note } from '../types/notes';
import { notesService } from '../services/notes';
import { useAuth } from '../contexts/AuthContext';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { NoteShareDialog } from '../components/notes/NoteShareDialog';

const NotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchNote = async () => {
      if (!id) {
        setError('Note ID is required');
        setLoading(false);
        return;
      }

      try {
        const noteRef = doc(db, 'notes', id);
        const noteDoc = await getDoc(noteRef);

        if (!noteDoc.exists()) {
          setError('Note not found');
          setLoading(false);
          return;
        }

        setNote({ id: noteDoc.id, ...noteDoc.data() } as Note);
      } catch (err) {
        setError('Failed to fetch note');
        console.error('Error fetching note:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const handleEdit = () => {
    if (note) {
      navigate(`/notes/${note.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!note || !user) return;

    try {
      setIsDeleting(true);
      await notesService.deleteNote(note.id, user.uid);
      navigate('/app/tasting-notes');
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleUpdateSharing = async (visibility: Note['visibility'], sharedWith: string[]) => {
    if (!note || !user) return;

    try {
      const updatedNote = await notesService.updateNoteSharing(note.id, user.uid, visibility, sharedWith);
      setNote(updatedNote);
    } catch (err) {
      console.error('Error updating note sharing:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error || 'Note not found'}</div>
      </div>
    );
  }

  const canEdit = user && note.userId === user.uid;

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/app/tasting-notes')}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            Back to Notes
          </button>
        </div>

        <NoteView
          note={note}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canEdit ? () => setShowDeleteDialog(true) : undefined}
          onShare={canEdit ? handleShare : undefined}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              <Dialog.Title className="text-lg font-medium">
                Delete Note
              </Dialog.Title>
            </div>

            <p className="mt-4 text-gray-600">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Share Dialog */}
      <NoteShareDialog
        note={note}
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        onUpdateSharing={handleUpdateSharing}
      />
    </>
  );
};

export default NotePage; 
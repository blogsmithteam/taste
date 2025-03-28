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

const NotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
      await notesService.deleteNote(user.uid, note.id);
      navigate('/tasting-notes', { replace: true });
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <button
          onClick={() => navigate('/notes')}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Back to Notes
        </button>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/notes')}
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
          onEdit={handleEdit}
          onDelete={() => setShowDeleteDialog(true)}
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
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-medium text-gray-900">
                  Delete Note
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-gray-500">
                  Are you sure you want to delete this note? This action cannot be undone.
                </Dialog.Description>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default NotePage; 
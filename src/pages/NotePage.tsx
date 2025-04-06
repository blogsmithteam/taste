import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import NoteView from '../components/notes/NoteView';
import { Note } from '../types/notes';
import { notesService } from '../services/notes';
import { useAuth } from '../contexts/AuthContext';
import { Dialog } from '@headlessui/react';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { NoteShareDialog } from '../components/notes/NoteShareDialog';
import CommentSection from '../components/notes/CommentSection';

const NotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharedNote, setIsSharedNote] = useState(false);

  // Get the source route from location state or default to tasting-notes
  const sourceRoute = (location.state?.from as string) || '/app/tasting-notes';
  const sourceRouteMap: Record<string, string> = {
    '/app/tasting-notes': 'Notes',
    '/app/shared-with-me': 'Shared Notes',
    '/app/activity': 'Activity Feed',
    '/app/notifications': 'Notifications',
    '/app/users': 'Profile'
  };
  const sourceName = sourceRoute.startsWith('/app/users/') ? 'Profile' : (sourceRouteMap[sourceRoute] || 'Notes');

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

        const noteData = { id: noteDoc.id, ...noteDoc.data() } as Note;
        setNote(noteData);

        // Determine if this is a shared note (not owned by the current user)
        if (user && user.uid !== noteData.userId) {
          // Check if the note is shared with the current user explicitly
          const isExplicitlyShared = noteData.sharedWith && Array.isArray(noteData.sharedWith) && noteData.sharedWith.includes(user.uid);
          
          // Check if the note is public (visible to all)
          const isPublic = noteData.visibility === 'public';
          
          // Check if the note is visible to friends (requires a separate check through userService if needed)
          const isVisibleToFriends = noteData.visibility === 'friends';
          
          // Debug info to help troubleshoot
          console.log('Note sharing info:', {
            noteId: noteData.id, 
            isCurrentUserOwner: user.uid === noteData.userId,
            isExplicitlyShared,
            isPublic,
            isVisibleToFriends,
            sharedWith: noteData.sharedWith || [],
            visibility: noteData.visibility,
            currentUserId: user.uid
          });
          
          // For now, we'll set isSharedNote to true if any of these conditions are met
          // This is a more permissive approach that assumes users can interact with shared content
          setIsSharedNote(isExplicitlyShared || isPublic || isVisibleToFriends);
        } else {
          console.log('Note is owned by current user or user is not logged in', {
            noteId: noteData.id,
            noteUserId: noteData.userId,
            currentUserId: user?.uid
          });
        }
      } catch (err) {
        setError('Failed to fetch note');
        console.error('Error fetching note:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, user]);

  const handleEdit = () => {
    if (note) {
      navigate(`/app/notes/${note.id}/edit`, { state: { from: sourceRoute } });
    }
  };

  const handleDelete = async () => {
    if (!note || !user) return;

    try {
      setIsDeleting(true);
      await notesService.deleteNote(user.uid, note.id);
      navigate(sourceRoute);
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
      <div className="min-h-screen bg-taste-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-taste-primary"></div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen bg-taste-light">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-taste-primary/20 p-8 text-center">
              <p className="text-taste-primary/60 text-lg">{error || 'Note not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canEdit = user && note.userId === user.uid;

  return (
    <div className="min-h-screen bg-taste-light">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-6">
            <button
              onClick={() => navigate(sourceRoute)}
              className="inline-flex items-center text-taste-primary hover:text-taste-primary/80 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span>Back to {sourceName}</span>
            </button>
          </div>

          {/* Note Content */}
          <div className="bg-white rounded-lg shadow-sm border border-taste-primary/20 overflow-hidden">
            <NoteView
              note={note}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canEdit ? () => setShowDeleteDialog(true) : undefined}
              onShare={canEdit ? handleShare : undefined}
            />
            
            {/* Comments Section - only for shared notes */}
            <div className="px-8 pb-8">
              <CommentSection
                noteId={note.id}
                noteUserId={note.userId}
                likes={note.likes || 0}
                likedBy={note.likedBy || []}
                comments={note.comments || []}
                isSharedNote={isSharedNote}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl border border-taste-primary/20">
            <div className="flex items-center gap-4">
              <ExclamationTriangleIcon className="h-8 w-8 text-taste-primary" />
              <Dialog.Title className="text-lg font-medium text-taste-primary">
                Delete Note
              </Dialog.Title>
            </div>

            <p className="mt-4 text-taste-primary/60">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-sm font-medium text-taste-primary hover:text-taste-primary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-taste-primary hover:bg-taste-primary/90 rounded-md disabled:opacity-50 transition-colors"
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
    </div>
  );
};

export default NotePage; 
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Note } from '../types/notes';
import { NoteForm } from '../components/notes/NoteForm';
import { useAuth } from '../contexts/AuthContext';

const EditNote: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        
        // Check if the user has permission to edit this note
        if (noteData.userId !== user?.uid) {
          setError('You do not have permission to edit this note');
          setLoading(false);
          return;
        }

        setNote(noteData);
      } catch (err) {
        setError('Failed to fetch note');
        console.error('Error fetching note:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, user]);

  const handleSuccess = (updatedNote: Note) => {
    navigate(`/app/notes/${updatedNote.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F6] to-white pt-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-taste-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F6] to-white pt-1 flex flex-col items-center justify-center">
        <div className="text-taste-primary text-xl mb-4">{error}</div>
        <button
          onClick={() => navigate('/app/tasting-notes')}
          className="px-4 py-2 text-sm font-medium text-taste-primary hover:text-taste-primary/80 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F6] to-white pt-1">
      <div className="container mx-auto px-2 max-w-4xl">
        <div className="bg-white rounded shadow-sm p-2">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => navigate(`/app/notes/${note.id}`)}
              className="text-taste-primary hover:text-taste-primary/80 transition-colors"
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
            </button>
            <h2 className="text-2xl font-serif font-semibold text-gray-900">Edit Note</h2>
          </div>
          <NoteForm initialNote={note} onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  );
};

export default EditNote; 
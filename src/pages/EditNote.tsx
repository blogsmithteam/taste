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
          onClick={() => navigate('/app/tasting-notes')}
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/app/notes/${note.id}`)}
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
            Back to Note
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Note</h1>
        <NoteForm initialNote={note} onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default EditNote; 
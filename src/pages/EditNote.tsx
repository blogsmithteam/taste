import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Note } from '../types/notes';
import { NoteForm } from '../components/notes/NoteForm';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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
      <div className="min-h-screen bg-taste-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-taste-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-taste-light">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6 text-center">
              <p className="text-taste-primary/80 text-lg">{error}</p>
              <button
                onClick={() => navigate('/app/tasting-notes')}
                className="mt-4 inline-flex items-center text-taste-primary hover:text-taste-primary/80 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Notes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <div className="min-h-screen bg-taste-light">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-6">
            <button
              onClick={() => navigate(`/app/notes/${note.id}`)}
              className="inline-flex items-center text-taste-primary hover:text-taste-primary/80 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span>Back to Note</span>
            </button>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6">
            <h1 className="font-serif text-5xl font-semibold text-taste-primary mb-6">Edit Note</h1>
            <NoteForm initialNote={note} onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditNote; 
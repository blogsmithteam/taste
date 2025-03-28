import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notesService, Note, NoteFilters } from '../services/notes';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteFiltersComponent } from '../components/notes/NoteFilters';
import { Button } from '../components/auth/shared/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

export const TastingNotes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<NoteFilters>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  const fetchNotes = async (isInitial = false) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await notesService.fetchNotes(user.uid, {
        filters,
        lastVisible: isInitial ? null : lastVisible,
        pageSize: 10,
        sortBy: 'date',
        sortDirection: 'desc',
      });

      if (isInitial) {
        setNotes(result.notes);
        // Extract unique tags from notes
        const tags = new Set<string>();
        result.notes.forEach(note => {
          note.tags.forEach(tag => tags.add(tag));
        });
        setAvailableTags(Array.from(tags));
      } else {
        setNotes(prev => {
          const newNotes = [...prev, ...result.notes];
          // Update available tags with any new ones
          const tags = new Set<string>(availableTags);
          result.notes.forEach(note => {
            note.tags.forEach(tag => tags.add(tag));
          });
          setAvailableTags(Array.from(tags));
          return newNotes;
        });
      }

      setLastVisible(result.lastVisible);
      setHasMore(result.notes.length === 10);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(true);
  }, [user, filters]);

  const handleLoadMore = () => {
    fetchNotes(false);
  };

  const handleFiltersChange = (newFilters: NoteFilters) => {
    setFilters(newFilters);
    setLastVisible(null);
  };

  const handleFilterReset = () => {
    setFilters({});
    setLastVisible(null);
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/app/notes/${noteId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tasting Notes</h1>
        <Button
          onClick={() => navigate('/app/create-note')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Note
        </Button>
      </div>

      <NoteFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleFilterReset}
        availableTags={availableTags}
      />

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onClick={() => handleNoteClick(note.id)}
          />
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {!isLoading && hasMore && (
        <div className="flex justify-center mt-8">
          <Button variant="secondary" onClick={handleLoadMore}>
            Load More
          </Button>
        </div>
      )}

      {!isLoading && notes.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
          <p className="text-gray-600">
            {Object.keys(filters).length > 0
              ? 'Try adjusting your filters'
              : 'Start by creating your first tasting note'}
          </p>
        </div>
      )}
    </div>
  );
}; 
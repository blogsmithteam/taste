import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notesService, Note, NoteFilters } from '../../services/notes';
import { NoteCard } from './NoteCard';
import { NoteFiltersComponent } from './NoteFilters';
import { Button } from '../auth/shared/Button';

export const SharedWithMeNotes: React.FC = () => {
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

      const result = await notesService.fetchSharedWithMe(user.uid, {
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
      console.error('Error in SharedWithMeNotes:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load shared notes. Please try again.');
      }
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
    navigate(`/app/notes/${noteId}`, { state: { from: '/app/shared-with-me' } });
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please log in to view shared notes.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Shared with Me
          </h2>
        </div>
      </div>

      <div className="mb-6">
        <NoteFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onReset={handleFilterReset}
          availableTags={availableTags}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {notes.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No shared notes found.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => handleNoteClick(note.id)}
            />
          ))}
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="mt-6 text-center">
          <Button onClick={handleLoadMore} variant="secondary">
            Load More
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center mt-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}; 
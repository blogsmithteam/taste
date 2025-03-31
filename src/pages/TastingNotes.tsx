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
    navigate(`/app/notes/${noteId}`, { state: { from: '/app/tasting-notes' } });
  };

  return (
    <div>
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-serif text-5xl font-semibold text-[#E76F51] mb-2">Tasting Notes</h1>
              <p className="text-black text-xl">Capture and explore your taste experiences</p>
            </div>
            <Button
              onClick={() => navigate('/app/create-note')}
              variant="primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Note
            </Button>
          </div>

          <div className="bg-white/80 rounded-lg shadow-sm border border-[#E76F51]/10 p-6 mb-8">
            <NoteFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleFilterReset}
              availableTags={availableTags}
              showUserFilter={false}
            />
          </div>

          {error && (
            <div className="rounded-lg bg-[#E76F51]/5 border border-[#E76F51]/20 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-[#E76F51]">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map(note => (
              <div key={note.id} className="card-hover">
                <NoteCard
                  note={note}
                  onClick={() => handleNoteClick(note.id)}
                />
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E76F51]"></div>
            </div>
          )}

          {!isLoading && hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMore}
                className="bg-[#E76F51]/10 text-[#E76F51] hover:bg-[#E76F51] hover:text-white transition-colors"
              >
                Load More
              </Button>
            </div>
          )}

          {!isLoading && notes.length === 0 && (
            <div className="text-center py-12 bg-white/80 rounded-lg shadow-sm border border-[#E76F51]/10">
              <h3 className="font-serif text-xl font-medium text-[#E76F51] mb-2">No notes found</h3>
              <p className="text-[#E76F51]/70">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters'
                  : 'Start by creating your first tasting note'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
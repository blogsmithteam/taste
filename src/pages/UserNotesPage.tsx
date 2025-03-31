import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notesService, Note, NoteFilters } from '../services/notes';
import { userService } from '../services/user';
import { User } from '../types/user';
import { NoteCard } from '../components/notes/NoteCard';
import { NoteFiltersComponent } from '../components/notes/NoteFilters';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const UserNotesPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<NoteFilters>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const userProfile = await userService.getUserProfile(userId);
        setProfile(userProfile);
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error loading profile:', err);
      }
    };

    fetchProfile();
  }, [userId]);

  const fetchNotes = async (isInitial = false) => {
    if (!userId || !user) return;

    // Only fetch notes if we're following this user
    if (!profile?.followers?.includes(user.uid)) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await notesService.fetchUserFriendsNotes(userId);
      
      if (isInitial) {
        setNotes(result);
        // Extract unique tags from notes
        const tags = new Set<string>();
        result.forEach(note => {
          note.tags.forEach(tag => tags.add(tag));
        });
        setAvailableTags(Array.from(tags));
      } else {
        setNotes(prev => {
          const newNotes = [...prev, ...result];
          // Update available tags with any new ones
          const tags = new Set<string>(availableTags);
          result.forEach(note => {
            note.tags.forEach(tag => tags.add(tag));
          });
          setAvailableTags(Array.from(tags));
          return newNotes;
        });
      }

      setLastVisible(result[result.length - 1]);
      setHasMore(result.length === 10);
    } catch (err) {
      console.error('Error in UserNotesPage:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load notes. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(true);
  }, [userId, profile, user, filters]);

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
    navigate(`/app/notes/${noteId}`, { state: { from: `/app/users/${userId}/notes` } });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF1ED] flex items-center justify-center">
        <p className="text-taste-primary/60 text-lg">Please log in to view notes.</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#FDF1ED] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-taste-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF1ED]">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-6">
            <button
              onClick={() => navigate(`/app/users/${userId}`)}
              className="inline-flex items-center text-taste-primary hover:text-taste-primary/80 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span>Back to {profile.username}'s Profile</span>
            </button>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-serif text-5xl font-semibold text-[#E76F51] mb-2">
                {profile.username}'s Notes
              </h1>
              <p className="text-black text-xl">
                Shared tasting experiences from {profile.username}
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-lg shadow-sm border border-[#E76F51]/10 p-6 mb-8">
            <NoteFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleFilterReset}
              availableTags={availableTags}
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
              <button
                onClick={handleLoadMore}
                className="px-4 py-2 bg-[#E76F51] text-white rounded-lg hover:bg-[#E76F51]/90 transition-colors"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserNotesPage; 
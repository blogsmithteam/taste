import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { notesService, Note, NoteFilters } from '../../services/notes';
import { bookmarksService } from '../../services/bookmarks';
import { userService } from '../../services/user';
import { NoteCard } from './NoteCard';
import { NoteFiltersComponent } from './NoteFilters';
import { Button } from '../auth/shared/Button';
import { User } from '../../types/user';

export const SharedWithMeNotes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarkedNotes, setBookmarkedNotes] = useState<Set<string>>(new Set());
  const [userInfo, setUserInfo] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState<NoteFilters>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [lastLoadedIndex, setLastLoadedIndex] = useState<number>(0);

  const fetchUserInfo = async (userIds: string[]) => {
    const uniqueUserIds = Array.from(new Set(userIds));
    const userPromises = uniqueUserIds.map(async (userId) => {
      if (!userInfo[userId]) {
        const userProfile = await userService.getUserProfile(userId);
        return userProfile;
      }
      return null;
    });

    const users = await Promise.all(userPromises);
    const newUserInfo = { ...userInfo };
    users.forEach((user) => {
      if (user) {
        newUserInfo[user.id] = user;
      }
    });
    setUserInfo(newUserInfo);
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    try {
      const bookmarkedNoteIds = await bookmarksService.getUserBookmarks(user.uid);
      setBookmarkedNotes(new Set(bookmarkedNoteIds));
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  };

  const fetchNotes = async (isInitial = false) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching shared notes with params:', {
        isInitial,
        lastVisible: isInitial ? null : lastVisible,
        filters,
        pageSize: 10
      });

      const result = await notesService.fetchSharedWithMe(user.uid, {
        filters,
        lastVisible: isInitial ? null : lastVisible,
        pageSize: 10,
        sortBy: 'date',
        sortDirection: 'desc',
      });

      console.log('Fetched notes result:', {
        noteCount: result.notes.length,
        hasLastVisible: !!result.lastVisible,
        noteIds: result.notes.map(n => n.id),
        noteTypes: result.notes.map(n => ({ id: n.id, type: n.type, visibility: n.visibility }))
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
          // Ensure we don't add duplicates
          const newNoteIds = new Set(result.notes.map(n => n.id));
          const existingNotes = prev.filter(n => !newNoteIds.has(n.id));
          const updatedNotes = [...existingNotes, ...result.notes];
          
          // Update available tags
          const tags = new Set<string>(availableTags);
          result.notes.forEach(note => {
            note.tags.forEach(tag => tags.add(tag));
          });
          setAvailableTags(Array.from(tags));
          
          return updatedNotes;
        });
      }

      setLastVisible(result.lastVisible);
      setHasMore(result.notes.length === 10);

      // Fetch user info for the new notes
      await fetchUserInfo(result.notes.map(note => note.userId));
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
    fetchBookmarks();
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

  const handleBookmarkToggle = async (noteId: string, isBookmarked: boolean) => {
    if (!user) return;

    try {
      if (isBookmarked) {
        await bookmarksService.removeBookmark(user.uid, noteId);
        setBookmarkedNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(noteId);
          return newSet;
        });
      } else {
        await bookmarksService.addBookmark(user.uid, noteId);
        setBookmarkedNotes(prev => new Set(prev).add(noteId));
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      setError('Failed to update bookmark. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF1ED] flex items-center justify-center">
        <p className="text-taste-primary/60 text-lg">Please log in to view shared notes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF1ED]">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-serif text-5xl font-semibold text-[#E76F51] mb-2">Shared Notes</h1>
              <p className="text-black text-xl">Notes shared with you by others</p>
            </div>
          </div>

          <div className="bg-white/80 rounded-lg shadow-sm border border-[#E76F51]/10 p-6 mb-8">
            <NoteFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleFilterReset}
              availableTags={availableTags}
              showUserFilter={true}
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
                  note={{
                    ...note,
                    favorite: bookmarkedNotes.has(note.id)
                  }}
                  onClick={() => handleNoteClick(note.id)}
                  onFavoriteToggle={(noteId, favorite) => handleBookmarkToggle(noteId, !favorite)}
                  isBookmarkView={true}
                  sharedByUser={userInfo[note.userId]}
                  showWouldOrderAgain={false}
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
              <h3 className="font-serif text-xl font-medium text-[#E76F51] mb-2">No shared notes found</h3>
              <p className="text-[#E76F51]/70">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters'
                  : 'No one has shared any notes with you yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
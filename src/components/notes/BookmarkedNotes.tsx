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

export const BookmarkedNotes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [userInfo, setUserInfo] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NoteFilters>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);

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

  const fetchBookmarkedNotes = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get bookmarked note IDs
      const bookmarkedNoteIds = await bookmarksService.getUserBookmarks(user.uid);
      
      if (bookmarkedNoteIds.length === 0) {
        setNotes([]);
        setIsLoading(false);
        return;
      }

      // Track inaccessible notes without logging errors
      const inaccessibleNotes: string[] = [];

      // Fetch each bookmarked note
      const bookmarkedNotes = await Promise.all(
        bookmarkedNoteIds.map(async (noteId) => {
          try {
            const note = await notesService.fetchNote(noteId);
            return { ...note, favorite: true }; // Mark as bookmarked
          } catch (err) {
            // Silently track inaccessible notes without console errors
            inaccessibleNotes.push(noteId);
            return null;
          }
        })
      );

      // Handle inaccessible notes message
      if (inaccessibleNotes.length > 0) {
        // Only show error if there are inaccessible notes
        const message = inaccessibleNotes.length === 1
          ? "A bookmarked note is no longer accessible. The note may have been deleted or its visibility settings changed."
          : `${inaccessibleNotes.length} bookmarked notes are no longer accessible. These notes may have been deleted or their visibility settings changed.`;
        
        setError(message);

        // Optionally clean up inaccessible bookmarks
        try {
          await Promise.all(
            inaccessibleNotes.map(noteId => 
              bookmarksService.removeBookmark(user.uid, noteId)
            )
          );
        } catch (cleanupErr) {
          // Silently handle cleanup errors
          console.debug('Failed to clean up some inaccessible bookmarks');
        }
      }

      // Filter out any failed fetches and apply filters
      let filteredNotes = bookmarkedNotes.filter((note): note is Note => {
        if (!note) return false;
        
        if (filters.type && note.type !== filters.type) return false;
        if (filters.rating && note.rating !== filters.rating) return false;
        if (filters.wouldOrderAgain !== undefined && note.wouldOrderAgain !== filters.wouldOrderAgain) return false;
        if (filters.tags && filters.tags.length > 0 && !filters.tags.some(tag => note.tags.includes(tag))) return false;
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          const matchesSearch = 
            note.title.toLowerCase().includes(term) ||
            note.notes.toLowerCase().includes(term) ||
            note.tags.some(tag => tag.toLowerCase().includes(term)) ||
            (note.location?.name?.toLowerCase().includes(term) ?? false);
          if (!matchesSearch) return false;
        }
        if (filters.dateFrom) {
          const noteDate = note.date.toDate();
          if (noteDate < filters.dateFrom) return false;
        }
        if (filters.dateTo) {
          const noteDate = note.date.toDate();
          if (noteDate > filters.dateTo) return false;
        }
        
        return true;
      });

      // Sort by date
      filteredNotes.sort((a, b) => b.date.toMillis() - a.date.toMillis());

      // Fetch user information for all note owners
      await fetchUserInfo(filteredNotes.map(note => note.userId));

      setNotes(filteredNotes);

      // Extract unique tags
      const tags = new Set<string>();
      filteredNotes.forEach(note => {
        note.tags.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));

    } catch (err) {
      console.error('Error fetching bookmarked notes:', err);
      setError('Failed to load bookmarked notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarkedNotes();
  }, [user, filters]);

  const handleFiltersChange = (newFilters: NoteFilters) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters({});
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/app/notes/${noteId}`, { state: { from: '/app/bookmarks' } });
  };

  const handleBookmarkToggle = async (noteId: string, isBookmarked: boolean) => {
    if (!user) return;

    try {
      if (isBookmarked) {
        await bookmarksService.removeBookmark(user.uid, noteId);
        setNotes(prev => prev.filter(note => note.id !== noteId));
      }
    } catch (err) {
      console.error('Error removing bookmark:', err);
      setError('Failed to remove bookmark. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF1ED] flex items-center justify-center">
        <p className="text-taste-primary/60 text-lg">Please log in to view your bookmarks.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF1ED]">
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="font-serif text-5xl font-semibold text-[#E76F51] mb-2">Bookmarks</h1>
              <p className="text-black text-xl">Your bookmarked notes</p>
            </div>
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
                  onFavoriteToggle={(noteId, favorite) => handleBookmarkToggle(noteId, !favorite)}
                  isBookmarkView={true}
                  sharedByUser={userInfo[note.userId]}
                />
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E76F51]"></div>
            </div>
          )}

          {!isLoading && notes.length === 0 && (
            <div className="text-center py-12 bg-white/80 rounded-lg shadow-sm border border-[#E76F51]/10">
              <h3 className="font-serif text-xl font-medium text-[#E76F51] mb-2">No bookmarks found</h3>
              <p className="text-[#E76F51]/70">
                {Object.keys(filters).length > 0
                  ? 'Try adjusting your filters'
                  : 'You haven\'t bookmarked any notes yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
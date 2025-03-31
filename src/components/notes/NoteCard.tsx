import React from 'react';
import { Note } from '../../services/notes';
import { FoodRating } from '../shared/FoodRating';
import { format } from 'date-fns';
import { MapPinIcon, CalendarIcon, TagIcon, UserIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { BookmarkIcon as BookmarkIconOutline } from '@heroicons/react/24/outline';
import { User } from '../../types/user';
import { useNavigate } from 'react-router-dom';

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
  onFavoriteToggle?: (noteId: string, favorite: boolean) => Promise<void>;
  isBookmarkView?: boolean;
  sharedByUser?: User;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onFavoriteToggle, isBookmarkView = false, sharedByUser }) => {
  const navigate = useNavigate();

  // Validate required fields
  if (!note || typeof note !== 'object') {
    console.error('Invalid note data:', note);
    return null;
  }

  // Ensure required fields exist with default values if missing
  const safeNote = {
    ...note,
    title: note.title || 'Untitled Note',
    type: note.type || 'restaurant',
    rating: typeof note.rating === 'number' ? note.rating : 0,
    date: note.date || null,
    notes: note.notes || '',
    tags: Array.isArray(note.tags) ? note.tags : [],
    wouldOrderAgain: typeof note.wouldOrderAgain === 'boolean' ? note.wouldOrderAgain : true,
    favorite: typeof note.favorite === 'boolean' ? note.favorite : false,
    visibility: note.visibility || 'private'
  };

  // Safely format date
  const formatDate = (date: any) => {
    try {
      if (!date || !date.toDate) {
        return 'Invalid date';
      }
      return format(date.toDate(), 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (onFavoriteToggle) {
      await onFavoriteToggle(note.id, !safeNote.favorite);
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the card click
    if (sharedByUser) {
      navigate(`/app/users/${sharedByUser.id}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-taste-primary/10 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-medium text-taste-primary">
              {safeNote.title}
            </h3>
            {onFavoriteToggle && (
              <button
                onClick={handleFavoriteClick}
                className="flex items-center p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={safeNote.favorite ? (isBookmarkView ? 'Remove bookmark' : 'Remove from favorites') : (isBookmarkView ? 'Add bookmark' : 'Add to favorites')}
              >
                {isBookmarkView ? (
                  safeNote.favorite ? (
                    <BookmarkIconSolid className="h-5 w-5 text-blue-500" />
                  ) : (
                    <BookmarkIconOutline className="h-5 w-5 text-gray-400 hover:text-blue-500" />
                  )
                ) : (
                  safeNote.favorite ? (
                    <HeartIconSolid className="h-5 w-5 text-red-500" />
                  ) : (
                    <HeartIconOutline className="h-5 w-5 text-gray-400 hover:text-red-500" />
                  )
                )}
              </button>
            )}
          </div>
          {safeNote.type === 'restaurant' && safeNote.location && (
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{safeNote.location.name || 'Unknown location'}</span>
            </div>
          )}
        </div>
        <FoodRating value={safeNote.rating} readonly size="sm" />
      </div>

      <div className="flex items-center text-sm text-gray-500 mb-2">
        <CalendarIcon className="h-4 w-4 mr-1" />
        <span>{formatDate(safeNote.date)}</span>
      </div>

      {safeNote.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <TagIcon className="h-4 w-4 text-gray-500" />
          <div className="flex flex-wrap gap-1">
            {safeNote.tags.map(tag => (
              <span 
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{safeNote.notes}</p>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            safeNote.wouldOrderAgain ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {safeNote.wouldOrderAgain ? 'Would order again' : 'Would not order again'}
          </span>
        </div>
        {sharedByUser && (
          <button
            onClick={handleUserClick}
            className="flex items-center text-gray-600 hover:text-taste-primary transition-colors text-sm"
          >
            {sharedByUser.photoURL ? (
              <img
                src={sharedByUser.photoURL}
                alt={sharedByUser.username}
                className="h-6 w-6 rounded-full mr-2"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                <span className="text-gray-500 text-xs">{sharedByUser.username[0].toUpperCase()}</span>
              </div>
            )}
            <span>{sharedByUser.username}</span>
          </button>
        )}
      </div>
    </div>
  );
}; 
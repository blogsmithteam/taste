import React from 'react';
import { Note } from '../../services/notes';
import { FoodRating } from '../shared/FoodRating';
import { format } from 'date-fns';
import { MapPinIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
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

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-taste-primary/10 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-taste-primary mb-1">
            {safeNote.title}
            {safeNote.favorite && (
              <HeartIconSolid className="h-5 w-5 text-red-500 inline-block ml-2" />
            )}
          </h3>
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
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            safeNote.visibility === 'private' 
              ? 'bg-gray-100 text-gray-800'
              : safeNote.visibility === 'friends'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {safeNote.visibility}
          </span>
        </div>
      </div>
    </div>
  );
}; 
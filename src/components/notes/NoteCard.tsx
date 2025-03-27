import React from 'react';
import { Note } from '../../services/notes';
import { FoodRating } from '../shared/FoodRating';
import { format } from 'date-fns';
import { MapPinIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline';

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{note.title}</h3>
          {note.type === 'restaurant' && note.location && (
            <div className="flex items-center text-gray-600 text-sm mt-1">
              <MapPinIcon className="h-4 w-4 mr-1" />
              <span>{note.location.name}</span>
            </div>
          )}
        </div>
        <FoodRating value={note.rating} readonly size="sm" />
      </div>

      <div className="flex items-center text-sm text-gray-500 mb-2">
        <CalendarIcon className="h-4 w-4 mr-1" />
        <span>{format(note.date.toDate(), 'MMM d, yyyy')}</span>
      </div>

      {note.tags.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <TagIcon className="h-4 w-4 text-gray-500" />
          <div className="flex flex-wrap gap-1">
            {note.tags.map(tag => (
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

      <p className="text-gray-600 text-sm line-clamp-2 mb-2">{note.notes}</p>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            note.wouldOrderAgain ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {note.wouldOrderAgain ? 'Would order again' : 'Would not order again'}
          </span>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            note.visibility === 'private' 
              ? 'bg-gray-100 text-gray-800'
              : note.visibility === 'friends'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {note.visibility}
          </span>
        </div>
      </div>
    </div>
  );
}; 
import React from 'react';
import { format } from 'date-fns';
import { StarIcon, MapPinIcon, LockClosedIcon, UserGroupIcon, GlobeAltIcon, ShareIcon } from '@heroicons/react/24/solid';
import { Note } from '../../types/notes';

interface NoteViewProps {
  note: Note;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

const NoteView: React.FC<NoteViewProps> = ({ note, onEdit, onDelete, onShare }) => {
  // Validate required fields
  if (!note || typeof note !== 'object') {
    console.error('Invalid note data:', note);
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <p className="text-red-600">Error: Invalid note data</p>
      </div>
    );
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
    improvements: Array.isArray(note.improvements) ? note.improvements : [],
    photos: Array.isArray(note.photos) ? note.photos : [],
    wouldOrderAgain: typeof note.wouldOrderAgain === 'boolean' ? note.wouldOrderAgain : true,
    visibility: note.visibility || 'private'
  };

  // Safely format date
  const formatDate = (date: any) => {
    try {
      if (!date || !date.toDate) {
        return 'Invalid date';
      }
      return format(date.toDate(), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const renderVisibilityIcon = () => {
    switch (safeNote.visibility) {
      case 'private':
        return <LockClosedIcon className="h-5 w-5 text-gray-600" title="Private" />;
      case 'friends':
        return <UserGroupIcon className="h-5 w-5 text-blue-600" title="Friends" />;
      case 'public':
        return <GlobeAltIcon className="h-5 w-5 text-green-600" title="Public" />;
      default:
        return null;
    }
  };

  const renderRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index: number) => (
          <StarIcon
            key={index}
            className={`h-5 w-5 ${
              index < safeNote.rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{safeNote.title}</h1>
          <div className="flex items-center gap-4">
            {renderVisibilityIcon()}
            {onShare && (
              <button
                onClick={onShare}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2"
              >
                <ShareIcon className="h-5 w-5" />
                Share
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-gray-600">
          <div>{formatDate(safeNote.date)}</div>
          {renderRating()}
          <div className="text-sm">{safeNote.type}</div>
        </div>
      </div>

      {/* Location (if restaurant) */}
      {safeNote.type === 'restaurant' && safeNote.location && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start gap-2">
            <MapPinIcon className="h-5 w-5 text-gray-500 mt-1" />
            <div>
              <h2 className="font-semibold text-gray-900">{safeNote.location.name || 'Unknown location'}</h2>
              {safeNote.location.address && (
                <p className="text-gray-600">{safeNote.location.address}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photos */}
      {safeNote.photos.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {safeNote.photos.map((photo: string, index: number) => (
              <img
                key={index}
                src={photo}
                alt={`Photo ${index + 1} for ${safeNote.title}`}
                className="rounded-lg object-cover w-full h-48"
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Notes</h2>
        <p className="whitespace-pre-wrap text-gray-700">{safeNote.notes}</p>
      </div>

      {/* Tags */}
      {safeNote.tags.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {safeNote.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {safeNote.improvements.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Improvements</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {safeNote.improvements.map((improvement: string, index: number) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Would Order Again */}
      <div className="p-6">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          safeNote.wouldOrderAgain
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}>
          {safeNote.wouldOrderAgain ? 'Would order again' : 'Would not order again'}
        </div>
      </div>
    </article>
  );
};

export default NoteView; 
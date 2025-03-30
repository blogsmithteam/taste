import React from 'react';
import { format } from 'date-fns';
import { StarIcon, MapPinIcon, PencilSquareIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline';
import { Note } from '../../types/notes';

interface NoteViewProps {
  note: Note;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

const NoteView: React.FC<NoteViewProps> = ({ note, onEdit, onDelete, onShare }) => {
  if (!note || typeof note !== 'object') {
    console.error('Invalid note data:', note);
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <p className="text-red-600">Error: Invalid note data</p>
      </div>
    );
  }

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
    location: note.location || null,
    visibility: note.visibility || 'private'
  };

  const formatDate = (date: any) => {
    try {
      if (!date || !date.toDate) return 'Invalid date';
      return format(date.toDate(), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const renderRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => (
          <StarIcon
            key={index}
            className={`h-5 w-5 ${
              index < safeNote.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-gray-600">{safeNote.rating} / 5</span>
      </div>
    );
  };

  return (
    <article className="p-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-serif text-gray-900">{safeNote.title}</h1>
          <div className="flex gap-2">
            {onShare && (
              <button
                onClick={onShare}
                className="p-2 text-gray-600 hover:text-taste-primary transition-colors"
                title="Share"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 text-gray-600 hover:text-taste-primary transition-colors"
                title="Edit"
              >
                <PencilSquareIcon className="h-5 w-5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <time dateTime={safeNote.date?.toDate?.().toISOString()}>
            {formatDate(safeNote.date)}
          </time>
          {renderRating()}
        </div>

        {/* Tags */}
        {safeNote.tags.length > 0 && (
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
        )}
      </div>

      {/* Location (if restaurant) */}
      {safeNote.type === 'restaurant' && safeNote.location && (
        <div className="mb-8 flex items-start gap-2 text-gray-600">
          <MapPinIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="font-medium text-gray-900">{safeNote.location.name}</h2>
            {safeNote.location.address && (
              <p className="text-sm">{safeNote.location.address}</p>
            )}
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {safeNote.photos.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            {safeNote.photos.map((photo: string, index: number) => (
              <img
                key={index}
                src={photo}
                alt={`Photo ${index + 1} for ${safeNote.title}`}
                className="rounded-lg w-full h-64 object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes Section */}
      <div className="mb-8">
        <h2 className="text-xl font-serif text-gray-900 mb-4">Notes</h2>
        <div className="prose prose-gray max-w-none">
          <p className="whitespace-pre-wrap text-gray-600 leading-relaxed">
            {safeNote.notes}
          </p>
        </div>
      </div>

      {/* Suggestions for Improvement */}
      {safeNote.improvements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-serif text-gray-900 mb-4">Suggestions for Improvement</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            {safeNote.improvements.map((improvement: string, index: number) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Final Verdict */}
      <div>
        <h2 className="text-xl font-serif text-gray-900 mb-4">Final Verdict</h2>
        <p className="flex items-center gap-2">
          <span className="text-gray-600">Would eat here again:</span>
          <span className={`font-medium ${safeNote.wouldOrderAgain ? 'text-green-600' : 'text-red-600'}`}>
            {safeNote.wouldOrderAgain ? 'Yes!' : 'No'}
          </span>
        </p>
      </div>
    </article>
  );
};

export default NoteView; 
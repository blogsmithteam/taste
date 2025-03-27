import React from 'react';
import { format } from 'date-fns';
import { StarIcon, MapPinIcon, LockClosedIcon, UserGroupIcon, GlobeAltIcon } from '@heroicons/react/24/solid';
import { Note } from '../../types/notes';

interface NoteViewProps {
  note: Note;
  onEdit?: () => void;
  onDelete?: () => void;
}

const NoteView: React.FC<NoteViewProps> = ({ note, onEdit, onDelete }) => {
  const renderVisibilityIcon = () => {
    switch (note.visibility) {
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
              index < note.rating ? 'text-yellow-400' : 'text-gray-300'
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
          <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
          <div className="flex items-center gap-4">
            {renderVisibilityIcon()}
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
          <div>{format(note.date.toDate(), 'MMMM d, yyyy')}</div>
          {renderRating()}
          <div className="text-sm">{note.type}</div>
        </div>
      </div>

      {/* Location (if restaurant) */}
      {note.type === 'restaurant' && note.location && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start gap-2">
            <MapPinIcon className="h-5 w-5 text-gray-500 mt-1" />
            <div>
              <h2 className="font-semibold text-gray-900">{note.location.name}</h2>
              <p className="text-gray-600">{note.location.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Photos */}
      {note.photos && note.photos.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {note.photos.map((photo: string, index: number) => (
              <img
                key={index}
                src={photo}
                alt={`Photo ${index + 1} for ${note.title}`}
                className="rounded-lg object-cover w-full h-48"
              />
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Notes</h2>
        <p className="whitespace-pre-wrap text-gray-700">{note.notes}</p>
      </div>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag: string) => (
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
      {note.improvements && note.improvements.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Improvements</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            {note.improvements.map((improvement: string, index: number) => (
              <li key={index}>{improvement}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Would Order Again */}
      {note.type === 'restaurant' && (
        <div className="p-6">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">Would order again:</span>
            <span className={note.wouldOrderAgain ? 'text-green-600' : 'text-red-600'}>
              {note.wouldOrderAgain ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      )}
    </article>
  );
};

export default NoteView; 
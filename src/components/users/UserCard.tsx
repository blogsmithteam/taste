import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../types/user';
import { UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface UserCardProps {
  user: User;
  showFamilyBadge?: boolean;
  showRemoveOption?: boolean;
  onRemove?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  showFamilyBadge = false,
  showRemoveOption = false,
  onRemove
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
      {showRemoveOption && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label="Remove user"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
      
      <Link to={`/app/users/${user.id}`} className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <img
            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`}
            alt={user.username}
            className="h-12 w-12 rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.username}
            </p>
            {showFamilyBadge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                <UserGroupIcon className="h-3 w-3 mr-1" />
                Family
              </span>
            )}
          </div>
          {user.bio && (
            <p className="text-sm text-gray-500 truncate">
              {user.bio}
            </p>
          )}
          {user.dietaryPreferences && user.dietaryPreferences.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.dietaryPreferences.slice(0, 3).map(pref => (
                <span
                  key={pref}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                >
                  {pref}
                </span>
              ))}
              {user.dietaryPreferences.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  +{user.dietaryPreferences.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}; 
import React from 'react';
import { User } from '../../types/user';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { FollowButton } from '../profile/FollowButton';
import { useNavigate } from 'react-router-dom';

interface UserCardProps {
  user: User;
  showFamilyBadge?: boolean;
  onRemove?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  showFamilyBadge = false,
  onRemove
}) => {
  const navigate = useNavigate();
  const hasDietaryInfo = (user.dietaryPreferences && user.dietaryPreferences.length > 0) || 
                        (user.allergies && user.allergies.length > 0);

  const handleClick = () => {
    navigate(`/app/users/${user.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow p-6 relative cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleClick}
    >
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      )}
      
      <div className="flex items-start space-x-4">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.username}
            className="h-12 w-12 rounded-full"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-lg font-medium text-gray-900 truncate">
                {user.username}
              </p>
              {showFamilyBadge && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                  Family
                </span>
              )}
            </div>
            <div onClick={e => e.stopPropagation()}>
              <FollowButton targetUserId={user.id} />
            </div>
          </div>
          
          {user.bio && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {user.bio}
            </p>
          )}

          {hasDietaryInfo && (
            <div className="mt-3 space-y-2">
              {user.dietaryPreferences && user.dietaryPreferences.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Dietary Preferences</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {user.dietaryPreferences.map((pref, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20"
                      >
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {user.allergies && user.allergies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500">Allergies</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {user.allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
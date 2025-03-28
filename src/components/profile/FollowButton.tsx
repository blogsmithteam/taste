import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ targetUserId, onFollowChange }) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user) return;
      try {
        const following = await userService.isFollowing(user.uid, targetUserId);
        setIsFollowing(following);
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  const handleFollowToggle = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      if (isFollowing) {
        await userService.unfollowUser(user.uid, targetUserId);
      } else {
        await userService.followUser(user.uid, targetUserId);
      }
      setIsFollowing(!isFollowing);
      onFollowChange?.(!isFollowing);
    } catch (err) {
      setError((err as Error).message);
      console.error('Error toggling follow status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.uid === targetUserId) {
    return null;
  }

  return (
    <div>
      <button
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
          isFollowing
            ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            : 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : isFollowing ? (
          'Following'
        ) : (
          'Follow'
        )}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}; 
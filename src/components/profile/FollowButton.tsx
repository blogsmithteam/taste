import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user';

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export const FollowButton: React.FC<FollowButtonProps> = ({ targetUserId, onFollowChange }) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      try {
        const [following, requestStatus] = await Promise.all([
          userService.isFollowing(user.uid, targetUserId),
          userService.getFollowRequestStatus(user.uid, targetUserId)
        ]);
        setIsFollowing(following);
        setRequestStatus(requestStatus);
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    };

    checkStatus();
  }, [user, targetUserId]);

  const handleFollowToggle = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      if (isFollowing) {
        await userService.unfollowUser(user.uid, targetUserId);
        setIsFollowing(false);
        setRequestStatus(null); // Reset request status after unfollowing
        onFollowChange?.(false);
      } else {
        try {
          await userService.followUser(user.uid, targetUserId);
          // Check if a follow request was created (for private profiles)
          const newRequestStatus = await userService.getFollowRequestStatus(user.uid, targetUserId);
          if (newRequestStatus === 'pending') {
            setRequestStatus('pending');
            // Don't set isFollowing to true for private profiles
          } else {
            // For public profiles, set following to true immediately
            setIsFollowing(true);
          }
          onFollowChange?.(true);
        } catch (err) {
          if ((err as Error).message === 'Follow request already pending') {
            setRequestStatus('pending');
          } else {
            throw err;
          }
        }
      }
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

  let buttonText = 'Follow';
  let buttonClass = 'btn-primary';

  if (isLoading) {
    buttonText = 'Loading...';
  } else if (isFollowing) {
    buttonText = 'Unfollow';
    buttonClass = 'btn-secondary';
  } else if (requestStatus === 'pending') {
    buttonText = 'Requested';
    buttonClass = 'btn-secondary';
  }

  return (
    <div>
      <button
        onClick={handleFollowToggle}
        disabled={isLoading || requestStatus === 'pending'}
        className={`${buttonClass} ${
          (isLoading || requestStatus === 'pending') ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {buttonText}
      </button>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}; 
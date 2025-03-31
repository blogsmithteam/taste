import React from 'react';
import { User } from 'firebase/auth';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface UserAvatarProps {
  user?: User | null;
  username?: string;
  profilePicture?: string; 
  size?: AvatarSize;
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  username,
  profilePicture,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  // Get initials from the user object, username, or use a default
  const getInitials = (): string => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    if (username) {
      return username
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    return 'U';
  };

  // Get profile picture from the user object or profilePicture prop
  const getProfilePicture = (): string | null => {
    if (profilePicture) {
      return profilePicture;
    }
    
    if (user?.photoURL) {
      return user.photoURL;
    }
    
    return null;
  };

  const profilePic = getProfilePicture();
  const initials = getInitials();

  return (
    <div
      className={`flex items-center justify-center rounded-full overflow-hidden bg-taste-primary/10 text-taste-primary flex-shrink-0 ${
        sizeClasses[size]
      } ${className}`}
    >
      {profilePic ? (
        <img src={profilePic} alt={`${username || 'User'} avatar`} className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium">{initials}</span>
      )}
    </div>
  );
};

export default UserAvatar; 
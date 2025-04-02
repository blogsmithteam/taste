import React from 'react';
import { User } from 'firebase/auth';

interface MinimalUser {
  uid: string;
  photoURL: string | null;
  displayName: string | null;
}

interface UserAvatarProps {
  user: User | MinimalUser | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md', className = '' }) => {
  const sizeClasses = {
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
    
    return 'U';
  };

  // Get profile picture from the user object or profilePicture prop
  const getProfilePicture = (): string | null => {
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
        <img src={profilePic} alt="User avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="font-medium">{initials}</span>
      )}
    </div>
  );
};

export default UserAvatar; 
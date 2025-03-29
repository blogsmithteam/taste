import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfileView } from './UserProfileView';
import { Navigate } from 'react-router-dom';

export const MyProfileView: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <UserProfileView userId={user.uid} />;
}; 
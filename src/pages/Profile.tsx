import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { ProfileForm } from '../components/profile/ProfileForm';
import { ProfileFormData as UserProfile } from '../types/user';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userProfile = await userService.getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleProfileUpdate = () => {
    // Refresh profile data after update
    if (user) {
      userService.getUserProfile(user.uid).then(setProfile);
    }
  };

  if (loading) {
    return (
      <div className="section-container">
        <div className="section-inner">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-taste-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="section-container">
        <div className="section-inner">
          <div className="bg-white/80 rounded-lg shadow-sm p-6">
            <p className="text-center text-taste-primary">Please sign in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-container">
        <div className="section-inner">
          <div className="bg-white/80 rounded-lg shadow-sm p-6">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="section-inner">
        <div className="mb-12">
          <h1>Your Profile</h1>
          <p className="descriptive-text">Manage your profile information and preferences</p>
        </div>
        <ProfileForm
          initialData={profile || undefined}
          onSuccess={handleProfileUpdate}
        />
      </div>
    </div>
  );
};

export default Profile; 
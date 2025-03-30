import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { ProfileForm } from '../components/profile/ProfileForm';
import { UserProfile } from '../types/user';

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <div className="max-w-md mx-auto bg-white/90 rounded-lg shadow-lg p-6">
          <p className="text-center text-white">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="max-w-md mx-auto bg-white/90 rounded-lg shadow-lg p-6">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Your Profile</h1>
        <div className="bg-white/90 shadow rounded-lg p-6">
          <ProfileForm
            initialData={profile || undefined}
            onSuccess={handleProfileUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile; 
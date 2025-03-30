import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User } from '../types/user';
import { userService } from '../services/user';
import { useAuth } from '../contexts/AuthContext';
import { AddFamilyMemberModal } from '../components/family/AddFamilyMemberModal';
import { PlusIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const FamilyPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If no userId is provided in the URL, use the current user's ID
  const targetUserId = userId || currentUser?.uid;

  const fetchData = async () => {
    if (!targetUserId) return;

    try {
      setLoading(true);
      const [userProfile, familyMembersList] = await Promise.all([
        userService.getUserProfile(targetUserId),
        userService.getFamilyMembers(targetUserId)
      ]);

      if (!userProfile) {
        throw new Error('User not found');
      }

      setProfile(userProfile);
      setFamilyMembers(familyMembersList);
    } catch (err) {
      console.error('Error loading family members:', err);
      setError('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [targetUserId]);

  const handleUserClick = (userId: string) => {
    navigate(`/app/users/${userId}`);
  };

  const handleAddFamilyMember = async (familyMemberId: string) => {
    if (!currentUser) return;
    
    try {
      await userService.addFamilyMember(currentUser.uid, familyMemberId);
      // Refresh the data after adding a family member
      await fetchData();
    } catch (err) {
      throw err;
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

  if (error || !profile) {
    return (
      <div className="section-container">
        <div className="section-inner">
          <div className="bg-white/80 rounded-xl shadow-sm p-6">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error || 'Profile not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentUser = currentUser?.uid === profile.id;

  return (
    <div className="section-container">
      <div className="section-inner">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/app/users/${profile.id}`)}
            className="inline-flex items-center text-taste-primary hover:text-taste-primary/80 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Back to {profile.username}'s Profile</span>
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1>{isCurrentUser ? 'My Family' : `${profile.username}'s Family`}</h1>
                <p className="text-gray-500 mt-1">{familyMembers.length} family members</p>
              </div>
              {isCurrentUser && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary inline-flex items-center"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Family Member
                </button>
              )}
            </div>

            {familyMembers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {isCurrentUser ? 'You have no family members yet' : 'No family members yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {familyMembers.map((familyMember) => (
                  <div
                    key={familyMember.id}
                    onClick={() => handleUserClick(familyMember.id)}
                    className="flex flex-col p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-4 mb-3">
                      {familyMember.photoURL ? (
                        <img
                          src={familyMember.photoURL}
                          alt={familyMember.username}
                          className="h-12 w-12 rounded-full"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-lg">
                            {familyMember.username[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{familyMember.username}</h3>
                        {familyMember.bio && (
                          <p className="text-sm text-gray-500 line-clamp-1">{familyMember.bio}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {familyMember.dietaryPreferences && familyMember.dietaryPreferences.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {familyMember.dietaryPreferences.map((pref, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            >
                              {pref}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {familyMember.allergies && familyMember.allergies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {familyMember.allergies.map((allergy, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                            >
                              {allergy}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isCurrentUser && currentUser && (
          <AddFamilyMemberModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAdd={handleAddFamilyMember}
            currentUserId={currentUser.uid}
          />
        )}
      </div>
    </div>
  );
};

export default FamilyPage; 
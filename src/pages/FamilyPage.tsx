import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { User } from '../types/user';
import { AddFamilyMemberModal } from '../components/family/AddFamilyMemberModal';
import { UserCard } from '../components/users/UserCard';
import { PlusIcon } from '@heroicons/react/24/outline';
import { FirebaseError } from 'firebase/app';

const FamilyPage: React.FC = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFamilyMembers = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const members = await userService.getFamilyMembers(user.uid);
      setFamilyMembers(members);
    } catch (err) {
      setError('Failed to load family members. Please try again later.');
      console.error('Error fetching family members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilyMembers();
  }, [user]);

  const handleAddFamilyMember = async (familyMemberId: string) => {
    if (!user) return;
    
    try {
      setError(null); // Clear any existing errors
      await userService.addFamilyMember(user.uid, familyMemberId);
      await fetchFamilyMembers(); // Refresh the list
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'permission-denied') {
        // If it's a permission error, verify if the operation actually succeeded
        try {
          const updatedUser = await userService.getUserProfile(user.uid);
          if (updatedUser?.familyMembers?.includes(familyMemberId)) {
            // Operation succeeded despite the error, refresh the list
            await fetchFamilyMembers();
            return;
          }
        } catch (verifyErr) {
          console.error('Error verifying family member status:', verifyErr);
        }
      }
      setError('Failed to add family member. Please try again.');
      console.error('Error adding family member:', err);
      throw err; // Still throw for modal error handling
    }
  };

  const handleRemoveFamilyMember = async (familyMemberId: string) => {
    if (!user) return;
    
    try {
      await userService.removeFamilyMember(user.uid, familyMemberId);
      setFamilyMembers(prev => prev.filter(member => member.id !== familyMemberId));
    } catch (err) {
      if (err instanceof FirebaseError) {
        // Check if it's a permission error but the operation might have succeeded
        if (err.code === 'permission-denied') {
          // Verify if the operation actually succeeded by checking the family members
          try {
            const updatedUser = await userService.getUserProfile(user.uid);
            if (!updatedUser?.familyMembers?.includes(familyMemberId)) {
              // If the member is no longer in the list, the operation succeeded despite the error
              setFamilyMembers(prev => prev.filter(member => member.id !== familyMemberId));
              return;
            }
          } catch (verifyErr) {
            console.error('Error verifying family member status:', verifyErr);
          }
        }
      }
      setError('Failed to remove family member. Please try again.');
      console.error('Error removing family member:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Family Member
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-blue-900 mb-2">About Family Sharing</h2>
        <p className="text-sm text-blue-700">
          Family members have special access to view and share dietary preferences, 
          allergies, and tasting notes. This helps when planning meals or dining out together.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : familyMembers.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No family members yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Add your family members to share dietary preferences and allergies.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {familyMembers.map(member => (
            <div key={member.id} className="relative">
              <UserCard 
                user={member}
                showFamilyBadge={true}
                onRemove={() => handleRemoveFamilyMember(member.id)}
              />
            </div>
          ))}
        </div>
      )}

      {user && (
        <AddFamilyMemberModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddFamilyMember}
          currentUserId={user.uid}
        />
      )}
    </div>
  );
};

export default FamilyPage; 
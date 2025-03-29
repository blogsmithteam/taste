import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';
import { User } from '../types/user';
import { UserCard } from '../components/users/UserCard';
import { Button } from '../components/auth/shared/Button';
import { PlusIcon } from '@heroicons/react/24/outline';

const FamilyPage: React.FC = () => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFamilyMembers = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const family = await userService.getFamilyMembers(user.uid);
        setFamilyMembers(family);
      } catch (err) {
        setError('Failed to load family members. Please try again later.');
        console.error('Error fetching family members:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFamilyMembers();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Family</h1>
        <Button
          onClick={() => {/* TODO: Implement add family member flow */}}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Family Member
        </Button>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : familyMembers.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No family members yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Add family members to share dietary preferences and tasting notes.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {familyMembers.map(member => (
            <UserCard 
              key={member.id} 
              user={member}
              showFamilyBadge
              showRemoveOption
              onRemove={() => {/* TODO: Implement remove family member */}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FamilyPage; 
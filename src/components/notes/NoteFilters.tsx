import React, { useEffect, useState } from 'react';
import { NoteFilters } from '../../services/notes';
import { FormInput } from '../auth/shared/FormInput';
import { Button } from '../auth/shared/Button';
import { FoodRating } from '../shared/FoodRating';
import { Checkbox } from '../auth/shared/Checkbox';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { User } from '../../types/user';

interface NoteFiltersProps {
  filters: NoteFilters;
  onFiltersChange: (filters: NoteFilters) => void;
  onReset: () => void;
  availableTags: string[];
}

export const NoteFiltersComponent: React.FC<NoteFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  availableTags,
}) => {
  const { user } = useAuth();
  const [followedUsers, setFollowedUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    const fetchFollowedUsers = async () => {
      if (!user) return;

      try {
        setIsLoadingUsers(true);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) return;

        const userProfile = userDoc.data();
        const following = userProfile.following || [];

        // Fetch user details for each followed user
        const userPromises = following.map(async (userId: string) => {
          const followedUserDoc = await getDoc(doc(db, 'users', userId));
          if (!followedUserDoc.exists()) return null;
          return { id: followedUserDoc.id, ...followedUserDoc.data() } as User;
        });

        const users = (await Promise.all(userPromises)).filter((user): user is User => user !== null);
        setFollowedUsers(users);
      } catch (error) {
        console.error('Error fetching followed users:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchFollowedUsers();
  }, [user]);

  const handleChange = (
    name: keyof NoteFilters,
    value: string | number | boolean | Date | string[] | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [name]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Type Tabs with integrated search */}
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-taste-primary/60" />
          </div>
          <input
            type="text"
            placeholder="Search by title or notes..."
            value={filters.searchTerm || ''}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-taste-primary/20 rounded-lg placeholder:text-taste-primary/50 focus:outline-none focus:ring-2 focus:ring-taste-primary/30 text-taste-primary"
          />
        </div>

        <div className="flex rounded-lg shadow-sm bg-white border border-taste-primary/20 p-1 flex-1">
          <button
            onClick={() => handleChange('type', undefined)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              !filters.type ? 'bg-taste-primary text-white' : 'text-taste-primary hover:bg-taste-primary/10'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleChange('type', 'restaurant')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filters.type === 'restaurant' ? 'bg-taste-primary text-white' : 'text-taste-primary hover:bg-taste-primary/10'
            }`}
          >
            Restaurants
          </button>
          <button
            onClick={() => handleChange('type', 'recipe')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filters.type === 'recipe' ? 'bg-taste-primary text-white' : 'text-taste-primary hover:bg-taste-primary/10'
            }`}
          >
            Recipes
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-6 items-end">
        {/* User Filter */}
        <div className="w-64">
          <label className="block text-sm font-medium text-taste-primary mb-1.5">
            Filter by User
          </label>
          <select
            value={filters.userId || ''}
            onChange={(e) => handleChange('userId', e.target.value || undefined)}
            className="w-full rounded-lg border border-taste-primary/20 bg-white px-4 py-2 focus:border-taste-primary focus:outline-none focus:ring-1 focus:ring-taste-primary text-taste-primary"
          >
            <option value="">All Users</option>
            {followedUsers.map((followedUser) => (
              <option key={followedUser.id} value={followedUser.id}>
                {followedUser.username}
              </option>
            ))}
          </select>
        </div>

        <div className="w-40">
          <FormInput
            label="From"
            type="date"
            value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
            className="bg-white border-taste-primary/20 focus:ring-taste-primary/30 text-taste-primary"
          />
        </div>

        <div className="w-40">
          <FormInput
            label="To"
            type="date"
            value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
            onChange={(e) => handleChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
            className="bg-white border-taste-primary/20 focus:ring-taste-primary/30 text-taste-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-taste-primary mb-1.5">
            Rating
          </label>
          <FoodRating
            value={filters.rating || 0}
            onChange={(value) => handleChange('rating', value || undefined)}
            allowClear
          />
        </div>

        <div className="flex items-center">
          <Checkbox
            label="Would Order Again"
            checked={filters.wouldOrderAgain || false}
            onChange={(e) => handleChange('wouldOrderAgain', e.target.checked)}
            className="text-taste-primary"
          />
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleChange('tags', filters.tags?.includes(tag) 
                  ? filters.tags.filter(t => t !== tag)
                  : [...(filters.tags || []), tag]
                )}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filters.tags?.includes(tag) 
                    ? 'bg-taste-primary text-white' 
                    : 'bg-taste-primary/10 text-taste-primary hover:bg-taste-primary hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={onReset}
          variant="secondary"
          className="bg-[#E76F51]/10 text-[#E76F51] hover:bg-[#E76F51] hover:text-white transition-colors"
        >
          Reset Filters
        </Button>
      </div>
    </div>
  );
}; 
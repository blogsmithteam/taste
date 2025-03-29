import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { UserIcon } from '@heroicons/react/24/outline';
import { useUserProfile } from '../hooks/useUserProfile';

interface Activity {
  id: string;
  userId: string;
  type: 'note_created' | 'note_updated' | 'started_following';
  targetId: string; // ID of the note or user being acted upon
  timestamp: Timestamp;
  username: string;
  profilePicture?: string;
  title?: string; // For note-related activities
}

const BATCH_SIZE = 10; // Maximum number of users to query at once
const ACTIVITIES_PER_BATCH = 20; // Number of activities to fetch per batch

export const ActivityFeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(user);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchActivitiesForUserBatch = async (userIds: string[]) => {
      if (!userIds.length) {
        console.warn('Attempted to fetch activities with empty userIds array');
        return [];
      }

      try {
        console.log('Fetching activities for users:', userIds);
        const activitiesRef = collection(db, 'activities');
        const q = query(
          activitiesRef,
          where('userId', 'in', userIds),
          orderBy('timestamp', 'desc'),
          limit(ACTIVITIES_PER_BATCH)
        );

        const snapshot = await getDocs(q);
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];
        
        console.log(`Found ${activities.length} activities for batch`);
        return activities;
      } catch (err) {
        console.error('Error in fetchActivitiesForUserBatch:', err);
        if (err instanceof FirebaseError) {
          if (err.code === 'permission-denied') {
            throw new Error('You don\'t have permission to view these activities. Try following the users first.');
          }
          throw new Error(`Firebase error (${err.code}): ${err.message}`);
        }
        // Log the actual error for debugging
        console.error('Unexpected error details:', {
          error: err,
          userIds: userIds,
          type: err instanceof Error ? err.constructor.name : typeof err
        });
        throw new Error('An unexpected error occurred while fetching activities');
      }
    };

    const fetchAllActivities = async () => {
      if (!user || !profile || !profile.following.length) {
        setActivities([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Starting to fetch activities for', profile.following.length, 'followed users');
        console.log('Following list:', profile.following);
        
        // Split following list into batches of BATCH_SIZE
        const batches = [];
        for (let i = 0; i < profile.following.length; i += BATCH_SIZE) {
          batches.push(profile.following.slice(i, i + BATCH_SIZE));
        }

        console.log('Split into', batches.length, 'batches');

        // Fetch activities for each batch
        const allActivities: Activity[] = [];
        for (const batch of batches) {
          try {
            const batchActivities = await fetchActivitiesForUserBatch(batch);
            allActivities.push(...batchActivities);
          } catch (batchError) {
            console.error('Error fetching batch:', batchError);
            // Instead of silently continuing, propagate permission errors
            if (batchError instanceof Error && batchError.message.includes('permission')) {
              setError(batchError.message);
              setLoading(false);
              return;
            }
            // Continue with other batches for non-permission errors
            continue;
          }
        }

        console.log('Total activities fetched:', allActivities.length);

        // Sort all activities by timestamp
        const sortedActivities = allActivities.sort((a, b) => 
          b.timestamp.toMillis() - a.timestamp.toMillis()
        );

        setActivities(sortedActivities.slice(0, ACTIVITIES_PER_BATCH));
      } catch (err) {
        console.error('Error in fetchAllActivities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load activity feed');
      } finally {
        setLoading(false);
      }
    };

    fetchAllActivities();
  }, [user, profile]);

  const renderActivityContent = (activity: Activity) => {
    switch (activity.type) {
      case 'note_created':
        return (
          <span>
            created a new tasting note{' '}
            <span className="font-medium text-gray-900">{activity.title}</span>
          </span>
        );
      case 'note_updated':
        return (
          <span>
            updated their tasting note{' '}
            <span className="font-medium text-gray-900">{activity.title}</span>
          </span>
        );
      case 'started_following':
        return (
          <span>started following a new user</span>
        );
      default:
        return null;
    }
  };

  const handleActivityClick = async (activity: Activity) => {
    try {
      switch (activity.type) {
        case 'note_created':
        case 'note_updated':
          navigate(`/app/notes/${activity.targetId}`);
          break;
        case 'started_following':
          navigate(`/app/users/${activity.targetId}`);
          break;
      }
    } catch (err) {
      console.error('Navigation error:', err);
      setError('Failed to navigate to the selected item');
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (profileError || error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{profileError || error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile?.following.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">
          Follow some users to see their activity in your feed.
        </p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-lg">
          No recent activity from people you follow.
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  {activity.profilePicture ? (
                    <img
                      className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white"
                      src={activity.profilePicture}
                      alt={activity.username}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ring-8 ring-white">
                      <UserIcon className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <button
                      onClick={() => handleActivityClick(activity)}
                      className="text-sm text-gray-500 hover:text-indigo-600"
                    >
                      <span className="font-medium text-gray-900">
                        {activity.username}
                      </span>{' '}
                      {renderActivityContent(activity)}
                    </button>
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-gray-500">
                    {format(activity.timestamp.toDate(), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}; 
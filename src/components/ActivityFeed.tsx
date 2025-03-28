import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
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

export const ActivityFeed: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(user);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user || !profile || !profile.following.length) {
        setActivities([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Query activities collection for recent activities from followed users
        const activitiesRef = collection(db, 'activities');
        const q = query(
          activitiesRef,
          where('userId', 'in', profile.following), // Filter for followed users
          orderBy('timestamp', 'desc'),
          limit(20) // Show last 20 activities
        );

        const snapshot = await getDocs(q);
        const fetchedActivities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];

        setActivities(fetchedActivities);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activity feed');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
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

  const handleActivityClick = (activity: Activity) => {
    switch (activity.type) {
      case 'note_created':
      case 'note_updated':
        navigate(`/app/notes/${activity.targetId}`);
        break;
      case 'started_following':
        navigate(`/app/users/${activity.targetId}`);
        break;
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
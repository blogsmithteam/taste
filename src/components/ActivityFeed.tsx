import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, Timestamp, getDoc, doc, DocumentData } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import { UserIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useUserProfile } from '../hooks/useUserProfile';
import { activityService } from '../services/activity';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../lib/firebase';

interface Activity {
  id: string;
  userId: string;
  type: 'note_created' | 'note_updated' | 'started_following';
  targetId: string;
  timestamp: Timestamp;
  username: string;
  profilePicture?: string;
  title?: string;
  imageUrl?: string;
  likes?: number;
  comments?: number;
  isLiked?: boolean;
  // Additional fields for notes
  rating?: number;
  location?: {
    name: string;
    address?: string;
  };
  notes?: string;
  tags?: string[];
  // Fields for following activities
  targetUsername?: string;
  targetProfilePicture?: string;
}

interface UserData {
  username: string;
  photoURL?: string;
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
        const activities = await Promise.all(
          snapshot.docs.map(async docSnapshot => {
            const activity = { id: docSnapshot.id, ...docSnapshot.data() } as Activity;
            
            // For following activities, ensure we have the target user's information
            if (activity.type === 'started_following' && !activity.targetUsername) {
              try {
                const targetUserDoc = await getDoc(doc(db, 'users', activity.targetId));
                if (targetUserDoc.exists()) {
                  const targetUserData = targetUserDoc.data() as UserData;
                  activity.targetUsername = targetUserData.username;
                  activity.targetProfilePicture = targetUserData.photoURL;
                }
              } catch (error) {
                console.error('Error fetching target user data:', error);
              }
            }
            
            // For note activities, fetch the associated note data
            if ((activity.type === 'note_created' || activity.type === 'note_updated') && activity.targetId) {
              try {
                // First try to get the note document
                const noteDoc = await getDoc(doc(db, 'notes', activity.targetId));
                if (noteDoc.exists()) {
                  const noteData = noteDoc.data();
                  // Only include notes that should be visible to the user
                  const isPublic = noteData.visibility === 'public';
                  const isFriendsOnly = noteData.visibility === 'friends';
                  const isSharedWithUser = noteData.sharedWith?.includes(user?.uid);
                  
                  if (isPublic || (isFriendsOnly && profile?.following.includes(noteData.userId)) || isSharedWithUser) {
                    // Update activity with note data
                    activity.title = noteData.title || 'Untitled Note';
                    activity.rating = noteData.rating;
                    activity.location = noteData.location;
                    activity.notes = noteData.notes;
                    activity.tags = noteData.tags;
                    
                    // Only try to fetch the image if we successfully got the note data
                    if (noteData.hasImage) {
                      try {
                        const imageRef = ref(storage, `notes/${activity.targetId}/images/main`);
                        const url = await getDownloadURL(imageRef);
                        activity.imageUrl = url;
                      } catch (imageError) {
                        console.error('Error fetching image URL:', imageError);
                      }
                    }
                    return activity;
                  } else {
                    // Skip this activity if we don't have access to the note
                    return null;
                  }
                } else {
                  // Skip deleted notes
                  return null;
                }
              } catch (error) {
                console.error('Error fetching note data:', error);
                // Skip activities where we can't access the note
                return null;
              }
            }
            
            return activity;
          })
        );
        
        // Filter out null activities (ones we couldn't access)
        const filteredActivities = activities.filter(activity => activity !== null);
        console.log(`Found ${filteredActivities.length} accessible activities for batch`);
        return filteredActivities;
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
      case 'note_updated':
        const isNewNote = activity.type === 'note_created';
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <button 
                onClick={() => handleUserClick(activity.userId)}
                className="font-medium text-gray-900 hover:text-indigo-600"
              >
                {activity.username}
              </button>
              <span>{isNewNote ? 'shared a new tasting note' : 'updated their tasting note'}</span>
              <span>·</span>
              <time className="text-gray-500">{format(activity.timestamp.toDate(), 'MMM d')}</time>
            </div>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <button 
                onClick={() => handleActivityClick(activity)}
                className="block w-full text-left hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="p-3">
                  <div className="flex flex-col gap-3">
                    {activity.imageUrl && (
                      <div className="w-full h-48 rounded-md overflow-hidden bg-gray-50">
                        <img 
                          src={activity.imageUrl} 
                          alt={activity.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base text-gray-900">
                        {activity.title} {activity.location && (
                          <span className="text-gray-600">
                            at {activity.location.name}
                          </span>
                        )}
                      </h3>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );
      case 'started_following':
        return (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <button 
                  onClick={() => handleUserClick(activity.userId)}
                  className="font-medium text-gray-900 hover:text-indigo-600"
                >
                  {activity.username}
                </button>
                <span className="text-gray-500">started following</span>
                <button 
                  onClick={() => handleUserClick(activity.targetId)}
                  className="font-medium text-gray-900 hover:text-indigo-600"
                >
                  {activity.targetUsername}
                </button>
                <span>·</span>
                <time className="text-gray-500">{format(activity.timestamp.toDate(), 'MMM d')}</time>
              </div>
            </div>
            {activity.targetProfilePicture && (
              <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden">
                <img
                  src={activity.targetProfilePicture}
                  alt={activity.targetUsername}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const handleActivityClick = async (activity: Activity) => {
    if (!activity.targetId) {
      setError('Invalid note reference');
      return;
    }

    try {
      switch (activity.type) {
        case 'note_created':
        case 'note_updated':
          try {
            // Try to fetch the note first to check permissions
            const noteDoc = await getDoc(doc(db, 'notes', activity.targetId));
            if (!noteDoc.exists()) {
              setError('This note has been deleted');
              return;
            }
            navigate(`/app/notes/${activity.targetId}`, { state: { from: '/app/activity' } });
          } catch (err) {
            if (err instanceof FirebaseError && err.code === 'permission-denied') {
              setError('You don\'t have permission to view this note');
            } else {
              setError('Failed to access the note');
            }
          }
          break;
        case 'started_following':
          navigate(`/app/users/${activity.targetId}`);
          break;
      }
    } catch (err) {
      console.error('Navigation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to navigate to the selected item');
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/app/users/${userId}`);
  };

  const handleLike = async (activity: Activity) => {
    if (!user) return;

    try {
      const newIsLiked = await activityService.toggleLike(activity.id, user.uid);
      
      // Update the activities state
      setActivities(prevActivities =>
        prevActivities.map(a =>
          a.id === activity.id
            ? {
                ...a,
                likes: (a.likes || 0) + (newIsLiked ? 1 : -1),
                isLiked: newIsLiked
              }
            : a
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
      // Show error toast or message
    }
  };

  const handleComment = async (activity: Activity) => {
    // Navigate to a detailed view or open a comment modal
    navigate(`/app/activities/${activity.id}`);
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
      <ul role="list" className="space-y-4">
        {activities.map((activity) => (
          <li key={activity.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-3">
              <div className="flex items-center gap-3 mb-2">
                {activity.profilePicture ? (
                  <img
                    className="h-8 w-8 rounded-full bg-gray-400 flex-shrink-0"
                    src={activity.profilePicture}
                    alt={activity.username}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {renderActivityContent(activity)}
                </div>
              </div>
              <div className="flex items-center gap-6 mt-2 pl-11">
                <button
                  onClick={() => handleLike(activity)}
                  className="flex items-center text-gray-500 hover:text-red-500 transition-colors duration-200"
                >
                  {activity.isLiked ? (
                    <HeartIconSolid className="h-4 w-4 text-red-500" />
                  ) : (
                    <HeartIcon className="h-4 w-4" />
                  )}
                  <span className="ml-1.5 text-xs">{activity.likes || 0}</span>
                </button>
                <button
                  onClick={() => handleComment(activity)}
                  className="flex items-center text-gray-500 hover:text-blue-500 transition-colors duration-200"
                >
                  <ChatBubbleLeftIcon className="h-4 w-4" />
                  <span className="ml-1.5 text-xs">{activity.comments || 0}</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}; 
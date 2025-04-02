import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, orderBy, limit, getDocs, Timestamp, getDoc, doc, DocumentData } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { UserIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { useUserProfile } from '../hooks/useUserProfile';
import { activityService, Activity, ActivityComment } from '../services/activity';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../lib/firebase';
import UserAvatar from './shared/UserAvatar';

interface UserData {
  username: string;
}

interface MinimalUser {
  uid: string;
  photoURL: string | null;
  displayName: string | null;
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
  const [expandedCommentId, setExpandedCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            
            // Fetch comments for the activity
            try {
              const comments = await activityService.getComments(activity.id);
              activity.activityComments = comments;
            } catch (commentsError) {
              console.error('Error fetching comments:', commentsError);
              activity.activityComments = [];
            }

            // Fetch user data for the activity
            try {
              const userDoc = await getDoc(doc(db, 'users', activity.userId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                activity.username = userData.username || 'Unknown User';
              }
            } catch (userError) {
              console.error('Error fetching user data:', userError);
            }
            
            // For following activities, fetch target user data
            if (activity.type === 'started_following' && activity.targetId) {
              try {
                const targetUserDoc = await getDoc(doc(db, 'users', activity.targetId));
                if (targetUserDoc.exists()) {
                  const targetUserData = targetUserDoc.data();
                  activity.targetUsername = targetUserData.username || 'Unknown User';
                }
              } catch (targetUserError) {
                console.error('Error fetching target user data:', targetUserError);
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
    const timeAgo = formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true });
    
    switch (activity.type) {
      case 'note_created':
      case 'note_updated':
        const isNewNote = activity.type === 'note_created';
        return (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-[15px]">
              <button 
                onClick={() => handleUserClick(activity.userId)}
                className="font-semibold text-[#2F3336] hover:text-[#536471] transition-colors"
              >
                {activity.username}
              </button>
              <span className="text-[#536471]">{isNewNote ? 'shared a new tasting note' : 'updated their tasting note'}</span>
              <span className="text-[#536471] mx-0.5">·</span>
              <time className="text-[#536471]">{timeAgo}</time>
            </div>
            {activity.title && (
              <div className="bg-white rounded-xl border border-[#CFD9DE] overflow-hidden hover:border-[#A9B9C4] transition-colors">
                <button 
                  onClick={() => handleActivityClick(activity)}
                  className="block w-full text-left"
                >
                  <div className="p-3">
                    <div className="flex flex-col gap-3">
                      {activity.imageUrl && (
                        <div className="w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#F7F9F9]">
                          <img 
                            src={activity.imageUrl} 
                            alt={activity.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold text-[#2F3336] leading-5">
                          {activity.title}
                          {activity.location && (
                            <span className="text-[#536471] font-normal ml-1">
                              at {activity.location.name}
                            </span>
                          )}
                        </h3>
                        {activity.rating && (
                          <div className="mt-1 flex items-center">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < activity.rating! ? 'text-amber-500' : 'text-[#CFD9DE]'
                                  }`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        );
      case 'started_following':
        return (
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[15px]">
                <button 
                  onClick={() => handleUserClick(activity.userId)}
                  className="font-semibold text-[#2F3336] hover:text-[#536471] transition-colors"
                >
                  {activity.username}
                </button>
                <span className="text-[#536471]">started following</span>
                <button 
                  onClick={() => handleUserClick(activity.targetId)}
                  className="font-semibold text-[#2F3336] hover:text-[#536471] transition-colors"
                >
                  {activity.targetUsername}
                </button>
                <span className="text-[#536471] mx-0.5">·</span>
                <time className="text-[#536471]">{timeAgo}</time>
              </div>
            </div>
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
    if (!user) return;
    
    // Toggle comment form visibility
    if (expandedCommentId === activity.id) {
      setExpandedCommentId(null);
      setCommentText('');
      return;
    }
    setExpandedCommentId(activity.id);
  };

  const handleSubmitComment = async (activity: Activity, e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const newComment = await activityService.addComment(activity.id, user.uid, commentText);
      
      // Update the local state to show the new comment
      setActivities(prevActivities =>
        prevActivities.map(a =>
          a.id === activity.id
            ? { 
                ...a, 
                comments: (a.comments || 0) + 1,
                activityComments: [...(a.activityComments || []), newComment]
              }
            : a
        )
      );

      // Reset form
      setCommentText('');
      setExpandedCommentId(null);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2F3336]"></div>
      </div>
    );
  }

  if (profileError || error) {
    return (
      <div className="rounded-xl bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-red-800">Error</h3>
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
      <div className="text-center py-12">
        <p className="text-[#536471] text-[15px]">
          Follow some users to see their activity in your feed
        </p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#536471] text-[15px]">
          No recent activity from people you follow
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <article key={activity.id} className="bg-white rounded-2xl border border-[#CFD9DE] hover:border-[#A9B9C4] transition-colors p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 text-[15px] leading-5">
                <button 
                  onClick={() => handleUserClick(activity.userId)}
                  className="font-semibold text-[#0F1419] hover:underline"
                >
                  {activity.username}
                </button>
                <span className="text-[#536471]">
                  {activity.type === 'note_created' ? 'shared a new tasting note' : 
                   activity.type === 'note_updated' ? 'updated their tasting note' :
                   'started following'}
                </span>
                <span className="text-[#536471]">·</span>
                <time className="text-[#536471]">
                  {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}
                </time>
              </div>
              
              {(activity.type === 'note_created' || activity.type === 'note_updated') && activity.title && (
                <div className="mt-3 rounded-xl border border-[#CFD9DE] overflow-hidden hover:border-[#A9B9C4] transition-colors">
                  <button 
                    onClick={() => handleActivityClick(activity)}
                    className="block w-full text-left"
                  >
                    {activity.imageUrl && (
                      <div className="aspect-[16/9] w-full">
                        <img 
                          src={activity.imageUrl} 
                          alt={activity.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <h3 className="text-[15px] font-semibold text-[#0F1419] leading-5">
                        {activity.title}
                        {activity.location && (
                          <span className="text-[#536471] font-normal ml-1">
                            at {activity.location.name}
                          </span>
                        )}
                      </h3>
                      {activity.rating && (
                        <div className="mt-2 flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${
                                i < activity.rating! ? 'text-amber-500' : 'text-[#CFD9DE]'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              )}
              
              {activity.type === 'started_following' && (
                <div className="mt-2 flex items-center gap-3">
                  <button 
                    onClick={() => handleUserClick(activity.targetId)}
                    className="text-[15px] font-semibold text-[#0F1419] hover:underline"
                  >
                    {activity.targetUsername}
                  </button>
                </div>
              )}
              
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => handleLike(activity)}
                    className="group flex items-center gap-2 text-[#536471]"
                  >
                    {activity.isLiked ? (
                      <HeartIconSolid className="h-5 w-5 text-red-500" />
                    ) : (
                      <HeartIcon className="h-5 w-5 group-hover:text-red-500" />
                    )}
                    <span className="text-[13px] group-hover:text-red-500">
                      {activity.likes || 0}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleComment(activity)}
                    className="group flex items-center gap-2 text-[#536471]"
                  >
                    <ChatBubbleLeftIcon className="h-5 w-5 group-hover:text-[#1D9BF0]" />
                    <span className="text-[13px] group-hover:text-[#1D9BF0]">
                      {activity.comments || 0}
                    </span>
                  </button>
                </div>

                {/* Display Comments */}
                {activity.activityComments && activity.activityComments.length > 0 && (
                  <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
                    {activity.activityComments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <UserAvatar
                          user={{ 
                            uid: comment.userId,
                            photoURL: comment.profilePicture || null,
                            displayName: comment.username
                          } as MinimalUser}
                          size="sm"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUserClick(comment.userId)}
                              className="text-sm font-semibold text-[#0F1419] hover:underline"
                            >
                              {comment.username}
                            </button>
                            <span className="text-xs text-[#536471]">
                              {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm text-[#0F1419] mt-0.5">{comment.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Comment Form */}
                {expandedCommentId === activity.id && (
                  <form onSubmit={(e) => handleSubmitComment(activity, e)} className="mt-3">
                    <div className="flex gap-3">
                      <UserAvatar user={user} size="sm" />
                      <div className="flex-1">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add your comment..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] focus:border-transparent resize-none"
                          rows={2}
                          maxLength={500}
                        />
                        {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setExpandedCommentId(null);
                              setCommentText('');
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting || !commentText.trim()}
                            className="px-4 py-2 bg-[#1D9BF0] text-white rounded-lg hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Posting...' : 'Post'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}
      
      {loadingMore && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1D9BF0]"></div>
        </div>
      )}
    </div>
  );
}; 
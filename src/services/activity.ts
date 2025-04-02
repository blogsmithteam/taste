import { collection, addDoc, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove, doc, getDoc, Timestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { notificationsService } from './notifications';

type ActivityType = 'note_created' | 'note_updated' | 'started_following';

interface CreateActivityData {
  type: ActivityType;
  targetId: string;
  title?: string;
  imageUrl?: string;
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

export interface ActivityComment {
  id: string;
  userId: string;
  username: string;
  profilePicture?: string | null;
  text: string;
  createdAt: Timestamp;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'note_created' | 'note_updated' | 'started_following';
  targetId: string;
  title?: string;
  timestamp: Timestamp;
  username: string;
  imageUrl?: string;
  likes?: number;
  likedBy?: string[];
  comments?: number;
  activityComments?: ActivityComment[];
  isLiked?: boolean;
  rating?: number;
  location?: {
    name: string;
    address?: string;
  };
  notes?: string;
  tags?: string[];
  targetUsername?: string;
  targetProfilePicture?: string;
}

export interface ActivityService {
  createActivity(user: User, data: CreateActivityData): Promise<void>;
  toggleLike(activityId: string, userId: string): Promise<boolean>;
  addComment(activityId: string, userId: string, text: string): Promise<ActivityComment>;
  getComments(activityId: string): Promise<ActivityComment[]>;
}

export class ActivityService {
  async createActivity(user: User, data: CreateActivityData) {
    try {
      // Ensure we have a valid user
      if (!user || !user.uid) {
        throw new Error('Valid user is required to create activity');
      }

      const activityData = {
        type: data.type,
        targetId: data.targetId,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        likedBy: [],
        ...(data.title && { title: data.title }),
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
        ...(data.rating && { rating: data.rating }),
        ...(data.location && { location: data.location }),
        ...(data.notes && { notes: data.notes }),
        ...(data.tags && { tags: data.tags }),
        ...(data.targetUsername && { targetUsername: data.targetUsername }),
        ...(data.targetProfilePicture && { targetProfilePicture: data.targetProfilePicture })
      };

      await addDoc(collection(db, 'activities'), activityData);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async toggleLike(activityId: string, userId: string) {
    try {
      const activityRef = doc(db, 'activities', activityId);
      const activityDoc = await getDoc(activityRef);

      if (!activityDoc.exists()) {
        throw new Error('Activity not found');
      }

      const activity = activityDoc.data();
      const likedBy = activity.likedBy || [];
      const isLiked = likedBy.includes(userId);

      await updateDoc(activityRef, {
        likes: increment(isLiked ? -1 : 1),
        likedBy: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });

      return !isLiked;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  async addComment(activityId: string, userId: string, text: string): Promise<ActivityComment> {
    if (!userId) throw new Error('User ID is required');
    if (!activityId) throw new Error('Activity ID is required');
    if (!text.trim()) throw new Error('Comment text is required');

    try {
      // Get user info for the comment
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      // Get the activity
      const activityRef = doc(db, 'activities', activityId);
      const activityDoc = await getDoc(activityRef);

      if (!activityDoc.exists()) {
        throw new Error('Activity not found');
      }

      const activity = activityDoc.data();
      
      // Create a new comment
      const newComment: ActivityComment = {
        id: crypto.randomUUID(),
        userId,
        username: userData.username || 'Anonymous',
        profilePicture: userData.profilePicture || null,
        text: text.trim(),
        createdAt: Timestamp.now()
      };

      // Update the activity with the new comment
      await updateDoc(activityRef, {
        activityComments: arrayUnion(newComment),
        comments: (activity.comments || 0) + 1,
        updatedAt: serverTimestamp()
      });

      // Create notification for the activity owner if commenter is not the owner
      if (activity.userId !== userId) {
        await notificationsService.createNotification({
          type: 'note_commented',
          senderId: userId,
          senderUsername: userData.username || 'Anonymous',
          recipientId: activity.userId,
          targetId: activityId,
          title: activity.title || 'activity'
        });
      }

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  async getComments(activityId: string): Promise<ActivityComment[]> {
    try {
      const activityRef = doc(db, 'activities', activityId);
      const activityDoc = await getDoc(activityRef);

      if (!activityDoc.exists()) {
        throw new Error('Activity not found');
      }

      const activity = activityDoc.data();
      return activity.activityComments || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw new Error('Failed to get comments');
    }
  }
}

export const activityService = new ActivityService(); 
import { collection, addDoc, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';

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

class ActivityService {
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

  async addComment(activityId: string, userId: string, comment: string) {
    try {
      const activityRef = doc(db, 'activities', activityId);
      const activityDoc = await getDoc(activityRef);

      if (!activityDoc.exists()) {
        throw new Error('Activity not found');
      }

      await updateDoc(activityRef, {
        comments: increment(1)
      });

      // Add comment to a separate comments collection
      await addDoc(collection(db, 'activity_comments'), {
        activityId,
        userId,
        comment,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }
}

export const activityService = new ActivityService(); 
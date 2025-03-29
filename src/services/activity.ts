import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';

type ActivityType = 'note_created' | 'note_updated' | 'started_following';

interface CreateActivityData {
  type: ActivityType;
  targetId: string;
  title?: string;
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
        ...(data.title && { title: data.title }) // Only include title if it exists
      };

      await addDoc(collection(db, 'activities'), activityData);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }
}

export const activityService = new ActivityService(); 
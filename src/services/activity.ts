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
      const activityData = {
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        profilePicture: user.photoURL || null,
        timestamp: serverTimestamp(),
        ...data
      };

      await addDoc(collection(db, 'activities'), activityData);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }
}

export const activityService = new ActivityService(); 
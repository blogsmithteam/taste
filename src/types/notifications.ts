import { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  | 'NEW_FOLLOWER'
  | 'NOTE_SHARED'
  | 'NOTE_COMMENT'
  | 'MENTION'
  | 'LIKE';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  data?: {
    noteId?: string;
    followerId?: string;
    commentId?: string;
  };
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    noteId?: string;
    followerId?: string;
    commentId?: string;
  };
} 
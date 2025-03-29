import { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  | 'follow'
  | 'note_shared'
  | 'note_liked'
  | 'note_commented';

export interface Notification {
  id: string;
  type: NotificationType;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  timestamp: Timestamp;
  read: boolean;
  targetId?: string; // ID of the note or other content being referenced
  title?: string; // Optional title for the notification (e.g., note title)
}

export interface CreateNotificationData {
  type: NotificationType;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  targetId?: string;
  title?: string;
} 
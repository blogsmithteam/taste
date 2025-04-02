import { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  | 'follow'
  | 'follow_request'
  | 'follow_request_accepted'
  | 'follow_request_rejected'
  | 'note_shared'
  | 'note_liked'
  | 'note_commented';

export interface Notification {
  id: string;
  type: NotificationType;
  senderId: string;
  senderUsername: string;
  senderProfilePicture?: string;  // Optional profile picture URL
  recipientId: string;
  timestamp: Timestamp;
  read: boolean;
  targetId?: string; // ID of the note or other content being referenced
  title?: string; // Optional title for the notification (e.g., note title)
  data?: any;
}

export interface CreateNotificationData {
  type: NotificationType;
  senderId: string;
  senderUsername: string;
  recipientId: string;
  timestamp: any;
  read: boolean;
  targetId?: string;
  title?: string;
}

export interface Notification extends CreateNotificationData {
  id: string;
  senderProfilePicture?: string;
} 
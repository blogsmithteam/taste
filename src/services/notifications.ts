import { 
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  collectionGroup,
  getDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Notification, CreateNotificationData } from '../types/notifications';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationsService = {
  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string, limitCount: number = 10): Promise<Notification[]> {
    try {
      // First verify the user exists and has notifications
      const userNotificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const q = query(
        userNotificationsRef,
        where('recipientId', '==', userId),
        where('read', '==', false),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      // Map and filter out any null results
      const notifications = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return data && {
            id: doc.id,
            ...data
          } as Notification;
        })
        .filter(Boolean);

      return notifications;
    } catch (error) {
      console.error('Error in getUnreadNotifications:', error);
      return [];
    }
  },

  /**
   * Get all notifications for a user
   */
  async getAllNotifications(userId: string, limitCount: number = 20): Promise<Notification[]> {
    try {
      const userNotificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const q = query(
        userNotificationsRef,
        where('recipientId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      
      // Map and filter out any null results
      const notifications = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          return data && {
            id: doc.id,
            ...data
          } as Notification;
        })
        .filter(Boolean);

      return notifications;
    } catch (error) {
      console.error('Error in getAllNotifications:', error);
      return [];
    }
  },

  /**
   * Create a new notification
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    // Create notification data without optional fields first
    const baseNotificationData = {
      type: data.type,
      senderId: data.senderId,
      senderUsername: data.senderUsername,
      recipientId: data.recipientId,
      timestamp: serverTimestamp(),
      read: false
    };

    // Add optional fields only if they exist and are not undefined
    const notificationData = {
      ...baseNotificationData,
      ...(data.targetId && { targetId: data.targetId }),
      ...(data.title && { title: data.title })
    };

    try {
      const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
      
      // Verify the notification was created
      const doc = await getDoc(docRef);
      if (!doc.exists()) {
        throw new Error('Failed to create notification');
      }

      return {
        id: docRef.id,
        ...notificationData,
        timestamp: Timestamp.now()
      } as Notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      // First verify we can access this notification
      const notificationDoc = await getDoc(notificationRef);
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      await updateDoc(notificationRef, {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notificationsRef = collection(db, NOTIFICATIONS_COLLECTION);
      const q = query(
        notificationsRef,
        where('recipientId', '==', userId),
        where('read', '==', false)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs
        .filter(doc => doc.exists())
        .map(doc => updateDoc(doc.ref, { read: true }));

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
      // First verify we can access this notification
      const notificationDoc = await getDoc(notificationRef);
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found');
      }

      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}; 
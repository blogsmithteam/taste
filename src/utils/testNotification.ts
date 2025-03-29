import { notificationsService } from '../services/notifications';
import { notesService } from '../services/notes';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NotificationType } from '../types/notifications';

export const createTestNotification = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('No user authenticated');
    return;
  }

  try {
    // Log current user info for debugging
    console.log('Current user info:', {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL
    });

    // Create a test note first
    const testNote = await notesService.createNote(currentUser.uid, {
      type: 'restaurant',
      title: 'Test Tasting Note',
      rating: 5,
      date: new Date().toISOString(),
      notes: 'This is a test note for notification testing.',
      tags: ['test'],
      visibility: 'private',
      photos: [],
      wouldOrderAgain: true,
      improvements: [],
      location: {
        name: 'Test Restaurant',
        address: '123 Test St',
        coordinates: {
          latitude: 0,
          longitude: 0
        }
      }
    });

    console.log('Created test note:', testNote);

    // Get user data for notification
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    const userData = userDoc.data();

    // Create a test notification
    await notificationsService.createNotification({
      type: 'note_shared',
      senderId: currentUser.uid,
      senderUsername: userData.username || currentUser.displayName || 'Test User',
      senderProfilePicture: userData.profilePicture || currentUser.photoURL,
      recipientId: currentUser.uid, // Send to self for testing
      targetId: testNote.id,
      title: testNote.title
    });

    console.log('Created test notification');

    return {
      noteId: testNote.id,
      success: true
    };
  } catch (error) {
    console.error('Error in test notification flow:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    throw error;
  }
}; 
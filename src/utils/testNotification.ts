import { notificationsService } from '../services/notifications';
import { notesService } from '../services/notes';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';
import { doc, getDoc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';

export const createTestNotification = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error('No user authenticated');
    return;
  }

  try {
    // Log current user info for debugging
    console.log('Current user auth:', {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    });

    // Use the other test user ID (Jack French)
    const testUserId = 'fpypNHoc9kPdhVNlsbuZpG0SdJF2'; // maddy@theblogsmith.com
    
    // Verify the test user exists and get their email
    const testUserDoc = await getDoc(doc(db, 'users', testUserId));
    if (!testUserDoc.exists()) {
      console.error('Test user not found');
      return;
    }

    // Log test user info for debugging
    const testUserData = testUserDoc.data();
    console.log('Test user document:', {
      uid: testUserId,
      data: {
        ...testUserData,
        following: testUserData.following || [],
        followers: testUserData.followers || []
      }
    });

    // First create a test note with all required fields
    const noteData = {
      userId: currentUser.uid,
      type: 'restaurant',
      title: 'Test Note',
      rating: 5,
      date: Timestamp.now(),
      notes: 'This is a test note for notification testing',
      tags: [],
      improvements: [],
      wouldOrderAgain: true,
      visibility: 'private',
      photos: [],
      sharedWith: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Create the note
    const noteRef = await addDoc(collection(db, 'notes'), noteData);
    console.log('Created test note:', noteRef.id);

    // Update note sharing using the notes service with the user's email
    await notesService.updateNoteSharing(noteRef.id, currentUser.uid, 'private', [testUserData.email]);
    console.log('Updated note sharing with email:', testUserData.email);

    // Create notification with all required fields - use UID for notification but email for sharing
    const notificationData = {
      userId: testUserId, // Use UID for notification
      type: 'NOTE_SHARED' as const,
      title: 'New Note Shared',
      message: `${currentUser.displayName || currentUser.email} shared their note "Test Note" with you`,
      read: false,
      createdAt: serverTimestamp(),
      data: {
        noteId: noteRef.id
      }
    };
    
    console.log('Attempting to create notification with data:', notificationData);
    const notification = await notificationsService.createNotification(notificationData);
    console.log('Test notification created:', notification);

    return {
      noteId: noteRef.id,
      notificationId: notification.id
    };
  } catch (error) {
    console.error('Error creating test notification:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      // Log the current user info for debugging
      console.log('Current user auth:', {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName
      });
    }
    throw error;
  }
}; 
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Bookmark {
  id: string;
  userId: string;
  noteId: string;
  createdAt: Timestamp;
}

export const bookmarksService = {
  async addBookmark(userId: string, noteId: string): Promise<void> {
    if (!userId || !noteId) {
      throw new Error('User ID and Note ID are required');
    }

    await setDoc(doc(collection(db, 'bookmarks')), {
      userId,
      noteId,
      createdAt: serverTimestamp(),
    });
  },

  async removeBookmark(userId: string, noteId: string): Promise<void> {
    if (!userId || !noteId) {
      throw new Error('User ID and Note ID are required');
    }

    const bookmarksQuery = query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId),
      where('noteId', '==', noteId)
    );

    const snapshot = await getDocs(bookmarksQuery);
    if (!snapshot.empty) {
      await deleteDoc(doc(db, 'bookmarks', snapshot.docs[0].id));
    }
  },

  async getUserBookmarks(userId: string): Promise<string[]> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const bookmarksQuery = query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(bookmarksQuery);
    return snapshot.docs.map(doc => doc.data().noteId);
  },

  async isNoteBookmarked(userId: string, noteId: string): Promise<boolean> {
    if (!userId || !noteId) {
      throw new Error('User ID and Note ID are required');
    }

    const bookmarkDoc = await getDocs(query(
      collection(db, 'bookmarks'),
      where('userId', '==', userId),
      where('noteId', '==', noteId)
    ));

    return !bookmarkDoc.empty;
  }
}; 
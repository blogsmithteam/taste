import { collection, addDoc, Timestamp, serverTimestamp, query, where, getDocs, orderBy, limit, startAfter, QueryConstraint, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { activityService } from './activity';
import { notificationsService } from './notifications';

export interface Note {
  id: string;
  userId: string;
  type: 'restaurant' | 'recipe';
  title: string;
  menuItemId?: string;
  rating: number;
  date: Timestamp;
  location?: {
    name: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  notes: string;
  tags: string[];
  improvements: string[];
  wouldOrderAgain: boolean;
  favorite: boolean;
  visibility: 'private' | 'friends' | 'public';
  photos: string[];
  sharedWith: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateNoteData {
  type: 'restaurant' | 'recipe';
  title: string;
  menuItemId?: string;
  rating: number;
  date: string;
  location?: {
    name: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  notes?: string;
  tags: string[];
  improvements: string[];
  wouldOrderAgain: boolean;
  favorite: boolean;
  visibility: 'private' | 'friends' | 'public';
  photos: string[];
}

export interface UpdateNoteData extends CreateNoteData {
  id: string;
}

export interface NoteFilters {
  type?: 'restaurant' | 'recipe';
  rating?: number;
  dateFrom?: Date;
  dateTo?: Date;
  wouldOrderAgain?: boolean;
  tags?: string[];
  searchTerm?: string;
  userId?: string;
}

export interface FetchNotesOptions {
  filters?: NoteFilters;
  pageSize?: number;
  lastVisible?: any;
  sortBy?: 'date' | 'rating' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

// Helper function to check if a note matches the search term
const matchesSearchTerm = (note: Note, searchTerm: string): boolean => {
  if (!searchTerm) return true;
  
  const term = searchTerm.toLowerCase();
  return (
    note.title.toLowerCase().includes(term) ||
    note.notes.toLowerCase().includes(term) ||
    (note.location?.name?.toLowerCase().includes(term) ?? false) ||
    (note.location?.address?.toLowerCase().includes(term) ?? false) ||
    note.tags.some(tag => tag.toLowerCase().includes(term)) ||
    note.improvements.some(improvement => improvement.toLowerCase().includes(term))
  );
};

export interface NotesService {
  createNote(userId: string, data: CreateNoteData): Promise<Note>;
  fetchNotes(userId: string, options?: FetchNotesOptions): Promise<{ notes: Note[]; lastVisible: any }>;
  fetchNote(noteId: string): Promise<Note>;
  updateNote(noteId: string, data: Partial<Note>): Promise<void>;
  deleteNote(noteId: string): Promise<void>;
  shareNote(noteId: string, userId: string): Promise<void>;
  unshareNote(noteId: string, userId: string): Promise<void>;
  fetchSharedNotes(userId: string): Promise<Note[]>;
  fetchUserFriendsNotes(userId: string, pageSize?: number): Promise<Note[]>;
  getUserNotes(userId: string): Promise<Note[]>;
}

export const notesService = {
  async createNote(userId: string, data: CreateNoteData): Promise<Note> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!data.title?.trim()) {
      throw new Error('Title is required');
    }

    if (!data.type) {
      throw new Error('Type is required');
    }

    if (!data.rating || data.rating < 1 || data.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    if (!data.date) {
      throw new Error('Date is required');
    }

    if (!data.visibility) {
      throw new Error('Visibility is required');
    }

    // If it's a restaurant note, validate location
    if (data.type === 'restaurant' && !data.location?.name?.trim()) {
      throw new Error('Restaurant name is required for restaurant notes');
    }

    // Clean up the location object to remove undefined values
    const location = data.location ? {
      name: data.location.name,
      ...(data.location.address && { address: data.location.address }),
      ...(data.location.coordinates?.latitude != null && 
        data.location.coordinates?.longitude != null && {
        coordinates: {
          latitude: data.location.coordinates.latitude,
          longitude: data.location.coordinates.longitude
        }
      })
    } : undefined;

    // Clean up the data by removing undefined values
    const cleanData = {
      type: data.type,
      title: data.title,
      ...(data.menuItemId && { menuItemId: data.menuItemId }), // Only include if defined
      rating: data.rating,
      date: Timestamp.fromDate(new Date(data.date)),
      ...(location && { location }), // Only include if defined
      notes: data.notes,
      tags: data.tags || [],
      improvements: data.improvements || [],
      wouldOrderAgain: data.wouldOrderAgain,
      favorite: data.favorite,
      visibility: data.visibility,
      photos: data.photos || [],
      sharedWith: [], // Initialize empty array for new notes
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'notes'), cleanData);
      const newNote = {
        id: docRef.id,
        ...cleanData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } as Note;

      // Get user data for activity creation
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      // Create a temporary User object for activity service
      const tempUser: User = {
        uid: userId,
        displayName: userData.username,
        photoURL: userData.profilePicture || null,
        email: userData.email,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        phoneNumber: null,
        providerId: 'firebase',
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({
          token: '',
          signInProvider: null,
          claims: {},
          authTime: '',
          issuedAtTime: '',
          expirationTime: '',
          signInSecondFactor: null
        }),
        reload: async () => {},
        toJSON: () => ({})
      };

      // Create activity for note creation
      await activityService.createActivity(tempUser, {
        type: 'note_created',
        targetId: docRef.id,
        title: data.title
      });

      return newNote;
    } catch (error) {
      console.error('Error creating note in Firestore:', error);
      throw new Error('Failed to create note in database');
    }
  },

  async fetchNotes(userId: string, options: FetchNotesOptions = {}): Promise<{ notes: Note[]; lastVisible: any }> {
    const {
      filters,
      pageSize = 10,
      lastVisible,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = options;

    const constraints: QueryConstraint[] = [
      where('userId', '==', userId)
    ];

    // Apply server-side filters
    if (filters) {
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters.rating) {
        constraints.push(where('rating', '==', filters.rating));
      }
      if (filters.wouldOrderAgain !== undefined) {
        constraints.push(where('wouldOrderAgain', '==', filters.wouldOrderAgain));
      }
      if (filters.dateFrom) {
        constraints.push(where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
      }
      if (filters.dateTo) {
        constraints.push(where('date', '<=', Timestamp.fromDate(filters.dateTo)));
      }
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }
    }

    // Add sorting
    constraints.push(orderBy(sortBy, sortDirection));

    // If we have a search term, fetch more results for client-side filtering
    const fetchSize = filters?.searchTerm ? Math.max(pageSize * 3, 30) : pageSize;
    
    // Add pagination
    constraints.push(limit(fetchSize));
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    const q = query(collection(db, 'notes'), ...constraints);
    const snapshot = await getDocs(q);

    let notes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
      } as Note;
    });

    // Apply client-side text search if needed
    if (filters?.searchTerm) {
      notes = notes.filter(note => matchesSearchTerm(note, filters.searchTerm!));
      // Trim to requested page size after filtering
      notes = notes.slice(0, pageSize);
    }

    return {
      notes,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
    };
  },

  async fetchPublicNotes(options: FetchNotesOptions = {}): Promise<{ notes: Note[]; lastVisible: any }> {
    const {
      filters,
      pageSize = 10,
      lastVisible,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = options;

    const constraints: QueryConstraint[] = [
      where('visibility', '==', 'public')
    ];

    // Apply filters (same as fetchNotes)
    if (filters) {
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters.rating) {
        constraints.push(where('rating', '==', filters.rating));
      }
      if (filters.wouldOrderAgain !== undefined) {
        constraints.push(where('wouldOrderAgain', '==', filters.wouldOrderAgain));
      }
      if (filters.dateFrom) {
        constraints.push(where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
      }
      if (filters.dateTo) {
        constraints.push(where('date', '<=', Timestamp.fromDate(filters.dateTo)));
      }
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }
    }

    // Add sorting
    constraints.push(orderBy(sortBy, sortDirection));

    // If we have a search term, fetch more results for client-side filtering
    const fetchSize = filters?.searchTerm ? Math.max(pageSize * 3, 30) : pageSize;

    // Add pagination
    constraints.push(limit(fetchSize));
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    const q = query(collection(db, 'notes'), ...constraints);
    const snapshot = await getDocs(q);

    let notes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
      } as Note;
    });

    // Apply client-side text search if needed
    if (filters?.searchTerm) {
      notes = notes.filter(note => matchesSearchTerm(note, filters.searchTerm!));
      // Trim to requested page size after filtering
      notes = notes.slice(0, pageSize);
    }

    return {
      notes,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
    };
  },

  async fetchFriendsNotes(userId: string, options: FetchNotesOptions = {}): Promise<{ notes: Note[]; lastVisible: any }> {
    const {
      filters,
      pageSize = 10,
      lastVisible,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = options;

    const constraints: QueryConstraint[] = [
      where('visibility', '==', 'friends')
    ];

    // Apply filters (same as fetchNotes)
    if (filters) {
      if (filters.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters.rating) {
        constraints.push(where('rating', '==', filters.rating));
      }
      if (filters.wouldOrderAgain !== undefined) {
        constraints.push(where('wouldOrderAgain', '==', filters.wouldOrderAgain));
      }
      if (filters.dateFrom) {
        constraints.push(where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
      }
      if (filters.dateTo) {
        constraints.push(where('date', '<=', Timestamp.fromDate(filters.dateTo)));
      }
      if (filters.tags && filters.tags.length > 0) {
        constraints.push(where('tags', 'array-contains-any', filters.tags));
      }
    }

    // Add sorting
    constraints.push(orderBy(sortBy, sortDirection));

    // If we have a search term, fetch more results for client-side filtering
    const fetchSize = filters?.searchTerm ? Math.max(pageSize * 3, 30) : pageSize;

    // Add pagination
    constraints.push(limit(fetchSize));
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    const q = query(collection(db, 'notes'), ...constraints);
    const snapshot = await getDocs(q);

    let notes = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
      } as Note;
    });

    // Apply client-side text search if needed
    if (filters?.searchTerm) {
      notes = notes.filter(note => matchesSearchTerm(note, filters.searchTerm!));
      // Trim to requested page size after filtering
      notes = notes.slice(0, pageSize);
    }

    return {
      notes,
      lastVisible: snapshot.docs[snapshot.docs.length - 1]
    };
  },

  async updateNote(noteId: string, userId: string, data: Partial<UpdateNoteData>): Promise<Note> {
    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      const noteData = noteDoc.data();
      if (noteData.userId !== userId) {
        throw new Error('Not authorized to update this note');
      }

      // Convert date string to Timestamp if it exists in the update data
      const updateData = {
        ...data,
        ...(data.date && { date: Timestamp.fromDate(new Date(data.date)) }),
        updatedAt: serverTimestamp()
      };

      await updateDoc(noteRef, updateData);

      // Get user data for activity creation
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      // Create a temporary User object for activity service
      const tempUser: User = {
        uid: userId,
        displayName: userData.username,
        photoURL: userData.profilePicture || null,
        email: userData.email,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        phoneNumber: null,
        providerId: 'firebase',
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({
          token: '',
          signInProvider: null,
          claims: {},
          authTime: '',
          issuedAtTime: '',
          expirationTime: '',
          signInSecondFactor: null
        }),
        reload: async () => {},
        toJSON: () => ({})
      };

      // Create activity for note update
      await activityService.createActivity(tempUser, {
        type: 'note_updated',
        targetId: noteId,
        title: noteData.title
      });

      // Return the updated note
      const updatedNoteDoc = await getDoc(noteRef);
      const updatedData = updatedNoteDoc.data();
      if (!updatedData) {
        throw new Error('Failed to fetch updated note data');
      }
      return {
        id: updatedNoteDoc.id,
        ...updatedData,
        date: updatedData.date instanceof Timestamp ? updatedData.date : Timestamp.fromDate(new Date(updatedData.date)),
        createdAt: updatedData.createdAt,
        updatedAt: updatedData.updatedAt || Timestamp.now()
      } as Note;
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  },

  async deleteNote(userId: string, noteId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!noteId) {
      throw new Error('Note ID is required');
    }

    const noteRef = doc(db, 'notes', noteId);
    const noteDoc = await getDoc(noteRef);

    if (!noteDoc.exists()) {
      throw new Error('Note not found');
    }

    const note = noteDoc.data() as Note;
    if (note.userId !== userId) {
      throw new Error('You do not have permission to delete this note');
    }

    try {
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note from Firestore:', error);
      throw new Error('Failed to delete note from database');
    }
  },

  async updateNoteSharing(noteId: string, userId: string, visibility: Note['visibility'], sharedWith: string[]): Promise<Note> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const noteRef = doc(db, 'notes', noteId);
    const noteDoc = await getDoc(noteRef);

    if (!noteDoc.exists()) {
      throw new Error('Note not found');
    }

    const existingNote = { id: noteDoc.id, ...noteDoc.data() } as Note;

    // Check if user has permission to update the note
    if (existingNote.userId !== userId) {
      throw new Error('You do not have permission to update this note');
    }

    // Only include the fields we want to update
    const updateData = {
      visibility,
      sharedWith,
      updatedAt: serverTimestamp(),
    };

    try {
      // Get the current user's data for notification
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      // Find new users who were added to sharedWith
      const newSharedUsers = sharedWith.filter(id => !existingNote.sharedWith.includes(id));

      if (newSharedUsers.length > 0) {
        // Create notifications for new users
        const notificationPromises = newSharedUsers.map(recipientId => 
          notificationsService.createNotification({
            type: 'note_shared',
            senderId: userId,
            senderUsername: userData.username,
            recipientId,
            targetId: noteId,
            title: existingNote.title
          })
        );

        // Update note and create notifications in parallel
        await Promise.all([
          updateDoc(noteRef, updateData),
          ...notificationPromises
        ]);
      } else {
        // If no new users, just update the note
        await updateDoc(noteRef, updateData);
      }

      // Return the updated note
      return {
        ...existingNote,
        visibility,
        sharedWith,
        updatedAt: Timestamp.now(),
      } as Note;
    } catch (error) {
      console.error('Error updating note sharing in Firestore:', error);
      throw new Error('Failed to update note sharing settings');
    }
  },

  async fetchSharedWithMe(userId: string, options: FetchNotesOptions = {}): Promise<{ notes: Note[]; lastVisible: any }> {
    const {
      filters,
      pageSize = 10,
      lastVisible,
      sortBy = 'createdAt',
      sortDirection = 'desc'
    } = options;

    try {
      // First, get the user's profile to get their following list
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userProfile = userDoc.data();
      const following = userProfile.following || [];

      // If filtering by specific user, check if we're following them
      if (filters?.userId && !following.includes(filters.userId)) {
        return { notes: [], lastVisible: null };
      }

      // Prepare base constraints that will be applied to both queries
      const baseConstraints: QueryConstraint[] = [];
      
      // Apply filters that are common to both queries
      if (filters) {
        if (filters.type) {
          baseConstraints.push(where('type', '==', filters.type));
        }
        if (filters.rating) {
          baseConstraints.push(where('rating', '==', filters.rating));
        }
        if (filters.wouldOrderAgain !== undefined) {
          baseConstraints.push(where('wouldOrderAgain', '==', filters.wouldOrderAgain));
        }
        if (filters.dateFrom) {
          baseConstraints.push(where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
        }
        if (filters.dateTo) {
          baseConstraints.push(where('date', '<=', Timestamp.fromDate(filters.dateTo)));
        }
        if (filters.tags && filters.tags.length > 0) {
          baseConstraints.push(where('tags', 'array-contains-any', filters.tags));
        }
      }

      // Add sorting
      baseConstraints.push(orderBy(sortBy, sortDirection));

      // If we have a search term, fetch more results for client-side filtering
      const fetchSize = filters?.searchTerm ? Math.max(pageSize * 3, 30) : pageSize;

      // Add pagination
      baseConstraints.push(limit(fetchSize));

      const allNotes: Note[] = [];
      
      // If filtering by specific user, only query their notes
      if (filters?.userId) {
        const friendsConstraints = [
          ...baseConstraints,
          where('visibility', '==', 'friends'),
          where('userId', '==', filters.userId)
        ];

        const friendsQuery = query(collection(db, 'notes'), ...friendsConstraints);
        const friendsSnapshot = await getDocs(friendsQuery);
        
        friendsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          allNotes.push({
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
          } as Note);
        });
      } else {
        // Process following list in batches of 10 (Firestore limit for 'in' queries)
        for (let i = 0; i < following.length; i += 10) {
          const batch = following.slice(i, i + 10);
          if (batch.length === 0) break;

          // Query for friends' notes
          const friendsConstraints = [
            ...baseConstraints,
            where('visibility', '==', 'friends'),
            where('userId', 'in', batch)
          ];

          const friendsQuery = query(collection(db, 'notes'), ...friendsConstraints);
          const friendsSnapshot = await getDocs(friendsQuery);
          
          friendsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            allNotes.push({
              id: doc.id,
              ...data,
              date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
            } as Note);
          });
        }
      }

      // Query for explicitly shared notes
      const sharedConstraints = [
        ...baseConstraints,
        where('sharedWith', 'array-contains', userId)
      ];

      // If filtering by specific user, add userId constraint
      if (filters?.userId) {
        sharedConstraints.push(where('userId', '==', filters.userId));
      }

      const sharedQuery = query(collection(db, 'notes'), ...sharedConstraints);
      const sharedSnapshot = await getDocs(sharedQuery);

      sharedSnapshot.docs.forEach(doc => {
        const data = doc.data();
        allNotes.push({
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
        } as Note);
      });

      // Remove duplicates (in case a note is both shared and from a friend)
      const uniqueNotes = Array.from(new Map(allNotes.map(note => [note.id, note])).values());
      
      // Sort the combined results
      uniqueNotes.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        // Handle different types of values
        if (aValue instanceof Timestamp && bValue instanceof Timestamp) {
          if (sortDirection === 'desc') {
            return bValue.toMillis() - aValue.toMillis();
          }
          return aValue.toMillis() - bValue.toMillis();
        }
        
        // For numeric values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (sortDirection === 'desc') {
            return bValue - aValue;
          }
          return aValue - bValue;
        }
        
        // Default to string comparison
        const aStr = String(aValue);
        const bStr = String(bValue);
        if (sortDirection === 'desc') {
          return bStr.localeCompare(aStr);
        }
        return aStr.localeCompare(bStr);
      });

      // Apply client-side text search if needed
      let filteredNotes = uniqueNotes;
      if (filters?.searchTerm) {
        filteredNotes = uniqueNotes.filter(note => matchesSearchTerm(note, filters.searchTerm!));
      }

      // Apply pagination
      const paginatedNotes = filteredNotes.slice(0, pageSize);

      return {
        notes: paginatedNotes,
        lastVisible: paginatedNotes[paginatedNotes.length - 1]
      };
    } catch (error) {
      console.error('Error in fetchSharedWithMe:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch shared notes: ${error.message}`);
      }
      throw new Error('Failed to fetch shared notes: Unknown error');
    }
  },

  async fetchUserFriendsNotes(userId: string, pageSize: number = 4): Promise<Note[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        where('visibility', '==', 'friends'),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      ];

      const q = query(collection(db, 'notes'), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
        } as Note;
      });
    } catch (error) {
      console.error('Error in fetchUserFriendsNotes:', error);
      throw new Error('Failed to fetch user notes');
    }
  },

  async getUserNotes(userId: string): Promise<Note[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        where('visibility', '==', 'private')
      ];

      const q = query(collection(db, 'notes'), ...constraints);
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
        } as Note;
      });
    } catch (error) {
      console.error('Error in getUserNotes:', error);
      throw new Error('Failed to fetch user notes');
    }
  }
}; 
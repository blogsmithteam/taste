import { collection, addDoc, Timestamp, serverTimestamp, query, where, getDocs, orderBy, limit, startAfter, QueryConstraint, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { activityService } from './activity';
import { notificationsService } from './notifications';
import { getAuth } from 'firebase/auth';
import { DocumentData, QuerySnapshot, DocumentSnapshot } from 'firebase/firestore';

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
  recipeUrl?: string;
  shareRecipe?: boolean;
  likes?: number;
  likedBy?: string[];
  comments?: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  profilePicture?: string;
  text: string;
  createdAt: Timestamp;
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
  recipeUrl?: string;
  shareRecipe?: boolean;
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

interface UserProfile {
  username: string;
  email: string;
  following?: string[];
  followers?: string[];
  settings?: {
    isPrivate?: boolean;
  };
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
  likeNote(noteId: string, userId: string): Promise<Note>;
  unlikeNote(noteId: string, userId: string): Promise<Note>;
  addComment(noteId: string, userId: string, text: string): Promise<Comment>;
  getComments(noteId: string): Promise<Comment[]>;
  deleteComment(noteId: string, commentId: string, userId: string): Promise<void>;
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
      recipeUrl: data.recipeUrl,
      shareRecipe: data.shareRecipe,
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
      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
      }
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

      // Clean up the data by removing undefined values and converting date
      const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Convert date string to Timestamp if it exists in the update data
      const updateData = {
        ...cleanedData,
        ...(cleanedData.date && { date: Timestamp.fromDate(new Date(cleanedData.date)) }),
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
            title: existingNote.title,
            timestamp: serverTimestamp(),
            read: false
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
      const userProfile = userDoc.data() as UserProfile;
      const following = userProfile.following || [];

      // Base query constraints
      const baseConstraints: QueryConstraint[] = [
        where('userId', '!=', userId), // Exclude user's own notes
        orderBy(sortBy, sortDirection)
      ];

      // Add filters
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
        if (filters.userId) {
          baseConstraints.push(where('userId', '==', filters.userId));
        }
        if (filters.dateFrom) {
          baseConstraints.push(where('date', '>=', Timestamp.fromDate(filters.dateFrom)));
        }
        if (filters.dateTo) {
          baseConstraints.push(where('date', '<=', Timestamp.fromDate(filters.dateTo)));
        }
      }

      // Add pagination
      baseConstraints.push(limit(pageSize));
      if (lastVisible) {
        baseConstraints.push(startAfter(lastVisible));
      }

      // Create three separate queries for each visibility type
      const sharedQuery = query(
        collection(db, 'notes'),
        where('sharedWith', 'array-contains', userId),
        ...baseConstraints
      );

      const publicQuery = query(
        collection(db, 'notes'),
        where('visibility', '==', 'public'),
        ...baseConstraints
      );

      const friendsQuery = query(
        collection(db, 'notes'),
        where('visibility', '==', 'friends'),
        ...baseConstraints
      );

      // Execute all queries in parallel
      const [sharedDocs, publicDocs, friendsDocs] = await Promise.all([
        getDocs(sharedQuery),
        getDocs(publicQuery),
        getDocs(friendsQuery)
      ]);

      const allNotes: Note[] = [];

      // Process shared notes
      sharedDocs.docs.forEach((doc: DocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        if (data) {
          allNotes.push({
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
          } as Note);
        }
      });

      // Process public notes
      publicDocs.docs.forEach((doc: DocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        if (data) {
          allNotes.push({
            id: doc.id,
            ...data,
            date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
          } as Note);
        }
      });

      // Process friends notes
      const friendsPromises = friendsDocs.docs.map(async (docSnapshot: DocumentSnapshot<DocumentData>) => {
        const data = docSnapshot.data();
        if (!data) return null;
        
        const ownerRef = doc(db, 'users', data.userId);
        const ownerDoc = await getDoc(ownerRef);
        
        if (ownerDoc.exists()) {
          const ownerData = ownerDoc.data() as UserProfile;
          // Include note if owner's profile is not private or if we're following them
          if (!ownerData.settings?.isPrivate || following.includes(data.userId)) {
            return {
              id: docSnapshot.id,
              ...data,
              date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
              createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
              updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
            } as Note;
          }
        }
        return null;
      });

      const friendsNotes = (await Promise.all(friendsPromises))
        .filter((note: Note | null): note is Note => note !== null);
      allNotes.push(...friendsNotes);

      // Remove duplicates and sort
      const uniqueNotes = Array.from(new Map(allNotes.map(note => [note.id, note])).values())
        .sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];
          
          if (aValue instanceof Timestamp && bValue instanceof Timestamp) {
            return sortDirection === 'desc' ? bValue.toMillis() - aValue.toMillis() : aValue.toMillis() - bValue.toMillis();
          }
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
          }
          
          return sortDirection === 'desc' ? 
            String(bValue).localeCompare(String(aValue)) : 
            String(aValue).localeCompare(String(bValue));
        });

      // Apply remaining filters
      let filteredNotes = uniqueNotes;
      if (filters?.tags && filters.tags.length > 0) {
        filteredNotes = filteredNotes.filter(note => 
          filters.tags!.some(tag => note.tags.includes(tag))
        );
      }

      if (filters?.searchTerm) {
        filteredNotes = filteredNotes.filter(note => matchesSearchTerm(note, filters.searchTerm!));
      }

      // Get the next page of notes
      const paginatedNotes = filteredNotes.slice(0, pageSize);
      const lastVisibleNote = paginatedNotes[paginatedNotes.length - 1];

      return {
        notes: paginatedNotes,
        lastVisible: lastVisibleNote
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
        orderBy('createdAt', 'desc')
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
  },

  async fetchNote(noteId: string): Promise<Note> {
    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      const data = noteDoc.data();
      const note = {
        id: noteDoc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date : Timestamp.fromDate(new Date(data.date)),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt : Timestamp.now()
      } as Note;

      // Get the current user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        // If no user is logged in, only return public notes
        if (note.visibility !== 'public') {
          throw new Error('Missing or insufficient permissions');
        }
        return note;
      }

      // If the user owns the note, they can access it
      if (note.userId === currentUser.uid) {
        return note;
      }

      // Check if the note is explicitly shared with the user
      if (note.sharedWith?.includes(currentUser.uid)) {
        return note;
      }

      // If the note is public, anyone can access it
      if (note.visibility === 'public') {
        return note;
      }

      // For friends-only notes, check if the user is following the note owner
      if (note.visibility === 'friends') {
        // Get both user docs in parallel for efficiency
        const [userDoc, ownerDoc] = await Promise.all([
          getDoc(doc(db, 'users', currentUser.uid)),
          getDoc(doc(db, 'users', note.userId))
        ]);

        if (!userDoc.exists()) {
          throw new Error('User not found');
        }
        if (!ownerDoc.exists()) {
          throw new Error('Note owner not found');
        }

        const userProfile = userDoc.data() as UserProfile;
        const ownerProfile = ownerDoc.data() as UserProfile;
        const following = userProfile.following || [];

        if (!ownerProfile.settings?.isPrivate || following.includes(note.userId)) {
          return note;
        }
      }

      throw new Error('Missing or insufficient permissions');
    } catch (error) {
      console.error('Error fetching note:', error);
      throw error;
    }
  },

  async likeNote(noteId: string, userId: string): Promise<Note> {
    if (!userId) throw new Error('User ID is required');
    if (!noteId) throw new Error('Note ID is required');

    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      const note = { id: noteDoc.id, ...noteDoc.data() } as Note;
      
      // Get the note owner's profile to check privacy settings
      const ownerDoc = await getDoc(doc(db, 'users', note.userId));
      if (!ownerDoc.exists()) {
        throw new Error('Note owner not found');
      }
      const ownerData = ownerDoc.data();
      
      // Check permissions
      const isOwner = note.userId === userId;
      const isExplicitlyShared = note.sharedWith && note.sharedWith.includes(userId);
      const isPublic = note.visibility === 'public';
      const isFriendsOnly = note.visibility === 'friends';
      
      // For friends-only notes, check if the profile is private and if the user is following
      const canViewFriendsNote = isFriendsOnly && (
        !ownerData.settings?.isPrivate || // Non-private profiles allow viewing friends-only notes
        (ownerData.settings?.isPrivate && ownerData.followers?.includes(userId)) // Private profiles require following
      );
      
      if (!isOwner && !isExplicitlyShared && !isPublic && !canViewFriendsNote) {
        // Add debug info to help troubleshoot
        console.log('Permission denied:', {
          noteId,
          userId,
          noteOwnerId: note.userId,
          isSharedWith: note.sharedWith,
          visibility: note.visibility,
          isPrivateProfile: ownerData.settings?.isPrivate,
          isFollowing: ownerData.followers?.includes(userId)
        });
        throw new Error('You do not have permission to like this note');
      }
      
      // Check if the user already liked this note
      const likedBy = note.likedBy || [];
      if (likedBy.includes(userId)) {
        return note; // User already liked this note
      }

      // Update the note with new like
      await updateDoc(noteRef, {
        likes: (note.likes || 0) + 1,
        likedBy: [...likedBy, userId],
        updatedAt: serverTimestamp()
      });

      // Get the updated note
      const updatedNoteDoc = await getDoc(noteRef);
      const updatedNote = { id: updatedNoteDoc.id, ...updatedNoteDoc.data() } as Note;

      // Get user data for notification
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists() && note.userId !== userId) {
        const userData = userDoc.data();
        
        // Create notification for the note owner
        await notificationsService.createNotification({
          type: 'note_liked',
          senderId: userId,
          senderUsername: userData.username,
          recipientId: note.userId,
          targetId: noteId,
          title: note.title,
          timestamp: serverTimestamp(),
          read: false
        });
      }

      return updatedNote;
    } catch (error) {
      console.error('Error liking note:', error);
      throw new Error('Failed to like note');
    }
  },

  async unlikeNote(noteId: string, userId: string): Promise<Note> {
    if (!userId) throw new Error('User ID is required');
    if (!noteId) throw new Error('Note ID is required');

    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      const note = { id: noteDoc.id, ...noteDoc.data() } as Note;
      
      // Check permissions - multiple ways a user can interact with a note
      const isOwner = note.userId === userId;
      const isExplicitlyShared = note.sharedWith && note.sharedWith.includes(userId);
      const isPublic = note.visibility === 'public';
      
      // For friends-only notes, we'll assume it's accessible for now
      // In a production app, you would check if the user is a friend of the note owner
      const isFriendsOnly = note.visibility === 'friends';
      
      if (!isOwner && !isExplicitlyShared && !isPublic && !isFriendsOnly) {
        console.log('Permission denied:', {
          noteId,
          userId,
          noteOwnerId: note.userId,
          isSharedWith: note.sharedWith,
          visibility: note.visibility
        });
        throw new Error('You do not have permission to unlike this note');
      }
      
      // Check if the user has liked this note
      const likedBy = note.likedBy || [];
      if (!likedBy.includes(userId)) {
        return note; // User hasn't liked this note
      }

      // Update the note to remove the like
      await updateDoc(noteRef, {
        likes: Math.max(0, (note.likes || 1) - 1),
        likedBy: likedBy.filter(id => id !== userId),
        updatedAt: serverTimestamp()
      });

      // Get the updated note
      const updatedNoteDoc = await getDoc(noteRef);
      return { id: updatedNoteDoc.id, ...updatedNoteDoc.data() } as Note;
    } catch (error) {
      console.error('Error unliking note:', error);
      throw new Error('Failed to unlike note');
    }
  },

  async addComment(noteId: string, userId: string, comment: string): Promise<Comment> {
    if (!userId) throw new Error('User ID is required');
    if (!noteId) throw new Error('Note ID is required');
    if (!comment.trim()) throw new Error('Comment cannot be empty');

    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      const note = { id: noteDoc.id, ...noteDoc.data() } as Note;
      const comments = note.comments || [];
      const now = Timestamp.now();

      // Get user data for the comment
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      const userData = userDoc.data();

      // Add the new comment
      const newComment: Comment = {
        id: crypto.randomUUID(),
        userId,
        username: userData.username,
        text: comment,
        createdAt: now,
        profilePicture: userData.profilePicture || null
      };

      await updateDoc(noteRef, {
        comments: [...comments, newComment],
        updatedAt: serverTimestamp()
      });

      // Create notification for note owner if the commenter is not the owner
      if (note.userId !== userId) {
        await notificationsService.createNotification({
          type: 'note_commented',
          senderId: userId,
          senderUsername: userData.username,
          recipientId: note.userId,
          targetId: noteId,
          title: note.title,
          timestamp: serverTimestamp(),
          read: false
        });
      }

      return newComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  },

  async getComments(noteId: string): Promise<Comment[]> {
    if (!noteId) throw new Error('Note ID is required');

    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      const note = { id: noteDoc.id, ...noteDoc.data() } as Note;
      return note.comments || [];
    } catch (error) {
      console.error('Error getting comments:', error);
      throw new Error('Failed to get comments');
    }
  },

  async deleteComment(noteId: string, commentId: string, userId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required');
    if (!noteId) throw new Error('Note ID is required');
    if (!commentId) throw new Error('Comment ID is required');

    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteDoc = await getDoc(noteRef);

      if (!noteDoc.exists()) {
        throw new Error('Note not found');
      }

      const note = { id: noteDoc.id, ...noteDoc.data() } as Note;
      const comments = note.comments || [];

      // Find the comment
      const comment = comments.find(c => c.id === commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      // Check if user is authorized to delete the comment
      // Allow if user is the comment owner or the note owner
      if (comment.userId !== userId && note.userId !== userId) {
        throw new Error('Not authorized to delete this comment');
      }

      // Remove the comment
      const updatedComments = comments.filter(c => c.id !== commentId);

      await updateDoc(noteRef, {
        comments: updatedComments,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error('Failed to delete comment');
    }
  }
}; 
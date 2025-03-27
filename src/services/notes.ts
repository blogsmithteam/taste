import { collection, addDoc, Timestamp, serverTimestamp, query, where, getDocs, orderBy, limit, startAfter, QueryConstraint } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Note {
  id: string;
  userId: string;
  type: 'restaurant' | 'recipe';
  title: string;
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
  visibility: 'private' | 'friends' | 'public';
  photos: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateNoteData {
  type: 'restaurant' | 'recipe';
  title: string;
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
  notes: string;
  tags: string[];
  improvements: string[];
  wouldOrderAgain: boolean;
  visibility: 'private' | 'friends' | 'public';
  photos: string[];
}

export interface NoteFilters {
  type?: 'restaurant' | 'recipe';
  rating?: number;
  dateFrom?: Date;
  dateTo?: Date;
  wouldOrderAgain?: boolean;
  tags?: string[];
  searchTerm?: string;
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

    if (!data.notes?.trim()) {
      throw new Error('Notes are required');
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

    const noteData = {
      ...data,
      location,
      userId,
      date: Timestamp.fromDate(new Date(data.date)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, 'notes'), noteData);
      return {
        id: docRef.id,
        ...noteData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } as Note;
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

    let notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Note[];

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

    let notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Note[];

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

    let notes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Note[];

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
  }
}; 
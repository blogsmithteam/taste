import { collection, addDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
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
}; 
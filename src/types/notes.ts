import { Timestamp } from 'firebase/firestore';

export type NoteVisibility = 'private' | 'friends' | 'public';
export type NoteType = 'restaurant' | 'recipe';

interface Location {
  name: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Note {
  id: string;
  userId: string;
  type: NoteType;
  title: string;
  rating: number;
  date: Timestamp;
  location?: Location;
  photos: string[];
  notes?: string;
  tags: string[];
  improvements: string[];
  wouldOrderAgain: boolean;
  visibility: NoteVisibility;
  sharedWith: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
} 
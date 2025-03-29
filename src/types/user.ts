import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  photoURL?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
  settings: {
    isPrivate: boolean;
    emailNotifications?: boolean;
    language?: string;
  };
  following?: string[];
  followers?: string[];
  familyMembers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileFormData extends Omit<User, 'id' | 'createdAt' | 'updatedAt'> {}

export const DIETARY_PREFERENCES_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-Free',
  'Dairy-Free',
  'Kosher',
  'Halal',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Fat',
  'Low-Sodium'
];

export const DEFAULT_USER_SETTINGS = {
  isPrivate: false,
  emailNotifications: true,
  language: 'en'
}; 
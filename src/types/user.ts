import { Timestamp } from 'firebase/firestore';

export interface UserSettings {
  isPrivate: boolean;
  emailNotifications: boolean;
  language: 'en';
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio: string;
  dietaryPreferences: string[];
  allergies: string[];
  followers: string[];
  following: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  settings: UserSettings;
}

export interface ProfileFormData {
  username: string;
  bio: string;
  dietaryPreferences: string[];
  allergies: string[];
  settings: UserSettings;
}

export const DEFAULT_USER_SETTINGS: UserSettings = {
  isPrivate: false,
  emailNotifications: true,
  language: 'en'
};

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
  'Other'
]; 
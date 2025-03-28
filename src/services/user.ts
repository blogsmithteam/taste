import { doc, getDoc, setDoc, updateDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, ProfileFormData, DEFAULT_USER_SETTINGS } from '../types/user';

class UserService {
  async createUserProfile(uid: string, email: string, username: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const timestamp = serverTimestamp();
    const newUser: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
    } = {
      uid,
      username,
      email,
      profilePicture: '',
      bio: '',
      dietaryPreferences: [],
      allergies: [],
      followers: [],
      following: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      settings: DEFAULT_USER_SETTINGS
    };

    await setDoc(userRef, newUser);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return userDoc.data() as UserProfile;
  }

  async updateUserProfile(uid: string, data: Partial<ProfileFormData>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // If the profile doesn't exist, create it first
      await this.createUserProfile(uid, data.username || uid, data.username || 'User');
    }

    // Now update with the new data
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }
}

export const userService = new UserService(); 
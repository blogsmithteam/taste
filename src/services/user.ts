import { doc, getDoc, setDoc, updateDoc, serverTimestamp, FieldValue, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, ProfileFormData, DEFAULT_USER_SETTINGS } from '../types/user';
import { activityService } from './activity';
import { notificationsService } from './notifications';
import { User, IdTokenResult } from 'firebase/auth';

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

  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    const timestamp = serverTimestamp();

    // Get current user data for activity and notification creation
    const currentUserDoc = await getDoc(currentUserRef);
    if (!currentUserDoc.exists()) {
      throw new Error('Current user not found');
    }
    const currentUser = currentUserDoc.data() as UserProfile;

    // Create a temporary User object for activity service
    const tempUser: User = {
      uid: currentUserId,
      displayName: currentUser.username,
      photoURL: currentUser.profilePicture || null,
      email: currentUser.email,
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
      } as IdTokenResult),
      reload: async () => {},
      toJSON: () => ({})
    };

    await Promise.all([
      updateDoc(currentUserRef, {
        following: arrayUnion(targetUserId),
        updatedAt: timestamp
      }),
      updateDoc(targetUserRef, {
        followers: arrayUnion(currentUserId),
        updatedAt: timestamp
      }),
      activityService.createActivity(tempUser, {
        type: 'started_following',
        targetId: targetUserId
      }),
      notificationsService.createNotification({
        type: 'follow',
        senderId: currentUserId,
        senderUsername: currentUser.username || 'Unknown User',
        senderProfilePicture: currentUser.profilePicture,
        recipientId: targetUserId
      })
    ]);
  }

  async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Check if target user exists
    const targetUserDoc = await getDoc(targetUserRef);
    if (!targetUserDoc.exists()) {
      throw new Error('User not found');
    }

    // Check if actually following
    const currentUserDoc = await getDoc(currentUserRef);
    if (!currentUserDoc.exists()) {
      throw new Error('Current user not found');
    }

    const userData = currentUserDoc.data() as UserProfile;
    if (!userData.following.includes(targetUserId)) {
      throw new Error('Not following this user');
    }

    // Update current user's following list
    await updateDoc(currentUserRef, {
      following: arrayRemove(targetUserId),
      updatedAt: serverTimestamp()
    });

    // Update target user's followers list
    await updateDoc(targetUserRef, {
      followers: arrayRemove(currentUserId),
      updatedAt: serverTimestamp()
    });
  }

  async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!currentUserDoc.exists()) {
      return false;
    }

    const userData = currentUserDoc.data() as UserProfile;
    return userData.following.includes(targetUserId);
  }

  async getFollowingProfiles(userId: string): Promise<UserProfile[]> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data() as UserProfile;
    const followingIds = userData.following;

    if (!followingIds.length) {
      return [];
    }

    // Get all following users' profiles
    const followingProfiles = await Promise.all(
      followingIds.map(async (followingId) => {
        const followingDoc = await getDoc(doc(db, 'users', followingId));
        if (followingDoc.exists()) {
          return { ...followingDoc.data(), uid: followingDoc.id } as UserProfile;
        }
        return null;
      })
    );

    // Filter out any null values (users that weren't found)
    return followingProfiles.filter((profile): profile is UserProfile => profile !== null);
  }

  async deleteUser(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    try {
      // Delete the user document
      await deleteDoc(userRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }
}

export const userService = new UserService(); 
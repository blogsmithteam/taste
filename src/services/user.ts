import { doc, getDoc, setDoc, updateDoc, serverTimestamp, FieldValue, arrayUnion, arrayRemove, deleteDoc, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, ProfileFormData, DEFAULT_USER_SETTINGS } from '../types/user';
import { activityService } from './activity';
import { notificationsService } from './notifications';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

class UserService {
  async createUserProfile(uid: string, email: string, username: string): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const timestamp = serverTimestamp();
    const newUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & {
      createdAt: FieldValue;
      updatedAt: FieldValue;
    } = {
      username,
      email,
      bio: '',
      dietaryPreferences: [],
      allergies: [],
      followers: [],
      following: [],
      familyMembers: [],
      settings: DEFAULT_USER_SETTINGS,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    await setDoc(userRef, newUser);
  }

  async getUserProfile(uid: string): Promise<User | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data()
    } as User;
  }

  async updateUserProfile(uid: string, data: Partial<ProfileFormData>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await this.createUserProfile(uid, data.email || uid, data.username || 'User');
    }

    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  }

  async followUser(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    const timestamp = serverTimestamp();

    // Get target user data to check privacy settings
    const targetUserDoc = await getDoc(targetUserRef);
    if (!targetUserDoc.exists()) {
      throw new Error('Target user not found');
    }
    const targetUser = targetUserDoc.data() as User;

    // Get current user data for notifications
    const currentUserDoc = await getDoc(currentUserRef);
    if (!currentUserDoc.exists()) {
      throw new Error('Current user not found');
    }
    const currentUser = currentUserDoc.data() as User;

    // If the target user has a private profile, create a follow request instead
    if (targetUser.settings?.isPrivate) {
      // Check if there's already a pending request
      const requestsQuery = query(
        collection(db, 'follow_requests'),
        where('fromUserId', '==', currentUserId),
        where('toUserId', '==', targetUserId),
        where('status', '==', 'pending')
      );
      const existingRequests = await getDocs(requestsQuery);
      
      if (!existingRequests.empty) {
        throw new Error('Follow request already pending');
      }

      // Create the follow request
      const requestRef = doc(collection(db, 'follow_requests'));
      await setDoc(requestRef, {
        fromUserId: currentUserId,
        toUserId: targetUserId,
        status: 'pending',
        createdAt: timestamp
      });

      // Create notification for the target user
      await notificationsService.createNotification({
        type: 'follow_request',
        senderId: currentUserId,
        senderUsername: currentUser.username,
        recipientId: targetUserId,
        timestamp: timestamp as Timestamp,
        read: false
      });

      return;
    }

    // Create a temporary Firebase User object for activity service
    const tempUser: FirebaseUser = {
      uid: currentUserId,
      email: currentUser.email,
      displayName: currentUser.username,
      photoURL: currentUser.photoURL || null,
      emailVerified: true,
      isAnonymous: false,
      metadata: {
        creationTime: String(currentUser.createdAt),
        lastSignInTime: String(currentUser.updatedAt)
      },
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

    // First update the follow relationships and create activity
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
      })
    ]);

    // Create notification for the target user
    await notificationsService.createNotification({
      type: 'follow',
      senderId: currentUserId,
      senderUsername: currentUser.username,
      recipientId: targetUserId,
      timestamp: timestamp as Timestamp,
      read: false
    });
  }

  async getFollowRequestStatus(fromUserId: string, toUserId: string): Promise<string | null> {
    const requestsQuery = query(
      collection(db, 'follow_requests'),
      where('fromUserId', '==', fromUserId),
      where('toUserId', '==', toUserId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const requests = await getDocs(requestsQuery);
    if (requests.empty) return null;

    return requests.docs[0].data().status;
  }

  async handleFollowRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<void> {
    const requestRef = doc(db, 'follow_requests', requestId);
    const requestDoc = await getDoc(requestRef);
    
    if (!requestDoc.exists()) {
      throw new Error('Follow request not found');
    }

    const request = requestDoc.data();
    const timestamp = serverTimestamp();

    // Get user data for notifications
    const currentUserDoc = await getDoc(doc(db, 'users', request.toUserId));
    if (!currentUserDoc.exists()) {
      throw new Error('User not found');
    }
    const currentUser = currentUserDoc.data() as User;

    // Update the request status first
    await updateDoc(requestRef, {
      status,
      updatedAt: timestamp
    });

    if (status === 'accepted') {
      // Update the follow relationships in a transaction to ensure consistency
      await runTransaction(db, async (transaction) => {
        const fromUserRef = doc(db, 'users', request.fromUserId);
        const toUserRef = doc(db, 'users', request.toUserId);

        const fromUserDoc = await transaction.get(fromUserRef);
        const toUserDoc = await transaction.get(toUserRef);

        if (!fromUserDoc.exists() || !toUserDoc.exists()) {
          throw new Error('User document not found');
        }

        transaction.update(fromUserRef, {
          following: arrayUnion(request.toUserId),
          updatedAt: timestamp
        });

        transaction.update(toUserRef, {
          followers: arrayUnion(request.fromUserId),
          updatedAt: timestamp
        });
      });

      // Create notification for the requester
      await notificationsService.createNotification({
        type: 'follow_request_accepted',
        senderId: request.toUserId,
        senderUsername: currentUser.username,
        recipientId: request.fromUserId,
        timestamp: timestamp as Timestamp,
        read: false
      });
    } else {
      // Create notification for the requester
      await notificationsService.createNotification({
        type: 'follow_request_rejected',
        senderId: request.toUserId,
        senderUsername: currentUser.username,
        recipientId: request.fromUserId,
        timestamp: timestamp as Timestamp,
        read: false
      });
    }
  }

  async getPendingFollowRequests(userId: string): Promise<Array<{ id: string; fromUserId: string; createdAt: Timestamp }>> {
    const requestsQuery = query(
      collection(db, 'follow_requests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(requestsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; fromUserId: string; createdAt: Timestamp }>;
  }

  async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    const timestamp = serverTimestamp();

    // Check if target user exists
    const targetUserDoc = await getDoc(targetUserRef);
    if (!targetUserDoc.exists()) {
      throw new Error('User not found');
    }

    // Check if current user exists
    const currentUserDoc = await getDoc(currentUserRef);
    if (!currentUserDoc.exists()) {
      throw new Error('Current user not found');
    }

    const userData = currentUserDoc.data() as User;
    if (!userData.following?.includes(targetUserId)) {
      throw new Error('Not following this user');
    }

    await Promise.all([
      updateDoc(currentUserRef, {
        following: arrayRemove(targetUserId),
        updatedAt: timestamp
      }),
      updateDoc(targetUserRef, {
        followers: arrayRemove(currentUserId),
        updatedAt: timestamp
      })
    ]);
  }

  async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    if (!currentUserDoc.exists()) {
      return false;
    }

    const userData = currentUserDoc.data() as User;
    return userData.following?.includes(targetUserId) || false;
  }

  async getFollowingProfiles(userId: string): Promise<User[]> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data() as User;
    const followingIds = userData.following || [];

    if (!followingIds.length) {
      return [];
    }

    // Get all following users' profiles
    const followingProfiles = await Promise.all(
      followingIds.map(async (followingId) => {
        const followingDoc = await getDoc(doc(db, 'users', followingId));
        if (followingDoc.exists()) {
          return {
            id: followingDoc.id,
            ...followingDoc.data()
          } as User;
        }
        return null;
      })
    );

    // Filter out any null values (users that weren't found)
    return followingProfiles.filter((profile): profile is User => profile !== null);
  }

  async getFollowing(userId: string): Promise<User[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) throw new Error('User not found');
      
      const following = userDoc.data().following || [];
      if (following.length === 0) return [];

      const followingUsers = await Promise.all(
        following.map(async (followedId: string) => {
          const userDoc = await getDoc(doc(db, 'users', followedId));
          if (!userDoc.exists()) return null;
          return {
            id: userDoc.id,
            ...userDoc.data()
          } as User;
        })
      );

      return followingUsers.filter((user): user is User => user !== null);
    } catch (error) {
      console.error('Error getting following users:', error);
      throw error;
    }
  }

  async getFollowers(userId: string): Promise<User[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) throw new Error('User not found');
      
      const followers = userDoc.data().followers || [];
      if (followers.length === 0) return [];

      const followerUsers = await Promise.all(
        followers.map(async (followerId: string) => {
          const userDoc = await getDoc(doc(db, 'users', followerId));
          if (!userDoc.exists()) return null;
          return {
            id: userDoc.id,
            ...userDoc.data()
          } as User;
        })
      );

      return followerUsers.filter((user): user is User => user !== null);
    } catch (error) {
      console.error('Error getting follower users:', error);
      throw error;
    }
  }

  async getFamilyMembers(userId: string): Promise<User[]> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) throw new Error('User not found');
      
      const familyMembers = userDoc.data().familyMembers || [];
      if (familyMembers.length === 0) return [];

      const familyUsers = await Promise.all(
        familyMembers.map(async (familyId: string) => {
          const userDoc = await getDoc(doc(db, 'users', familyId));
          if (!userDoc.exists()) return null;
          return {
            id: userDoc.id,
            ...userDoc.data()
          } as User;
        })
      );

      return familyUsers.filter((user): user is User => user !== null);
    } catch (error) {
      console.error('Error getting family members:', error);
      throw error;
    }
  }

  async addFamilyMember(userId: string, familyMemberId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const familyMemberRef = doc(db, 'users', familyMemberId);
      const timestamp = serverTimestamp();

      // First, verify both users exist
      const [userDoc, familyMemberDoc] = await Promise.all([
        getDoc(userRef),
        getDoc(familyMemberRef)
      ]);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      if (!familyMemberDoc.exists()) {
        throw new Error('Family member not found');
      }

      // Add each user to the other's family members list
      await Promise.all([
        updateDoc(userRef, {
          familyMembers: arrayUnion(familyMemberId),
          updatedAt: timestamp
        }),
        updateDoc(familyMemberRef, {
          familyMembers: arrayUnion(userId),
          updatedAt: timestamp
        })
      ]);
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  }

  async removeFamilyMember(userId: string, familyMemberId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const familyMemberRef = doc(db, 'users', familyMemberId);
      const timestamp = serverTimestamp();

      // First, verify both users exist
      const [userDoc, familyMemberDoc] = await Promise.all([
        getDoc(userRef),
        getDoc(familyMemberRef)
      ]);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      if (!familyMemberDoc.exists()) {
        throw new Error('Family member not found');
      }

      // Remove each user from the other's family members list
      await Promise.all([
        updateDoc(userRef, {
          familyMembers: arrayRemove(familyMemberId),
          updatedAt: timestamp
        }),
        updateDoc(familyMemberRef, {
          familyMembers: arrayRemove(userId),
          updatedAt: timestamp
        })
      ]);
    } catch (error) {
      console.error('Error removing family member:', error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      // Get all users without filtering by privacy setting
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('username') // Order by username for consistent listing
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const users = querySnapshot.docs.map(doc => {
        const userData = doc.data();
        // For private profiles, only return basic information
        if (userData.settings?.isPrivate) {
          return {
            id: doc.id,
            username: userData.username,
            settings: {
              isPrivate: true,
              emailNotifications: userData.settings.emailNotifications,
              language: userData.settings.language
            },
            followers: userData.followers || [],
            following: userData.following || [],
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
          } as User;
        }
        // For public profiles, return all information
        return {
          id: doc.id,
          ...userData
        } as User;
      });

      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
}

export const userService = new UserService(); 
import { collection, query, where, getDocs, addDoc, orderBy, limit, serverTimestamp, doc, setDoc, collectionGroup, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Restaurant {
  id: string;
  name: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price?: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const restaurantsService = {
  async searchRestaurants(searchTerm: string): Promise<Restaurant[]> {
    if (!searchTerm.trim()) return [];

    try {
      console.log('Searching for restaurants with term:', searchTerm);
      const restaurantsRef = collection(db, 'restaurants');
      const q = query(
        restaurantsRef,
        where('name', '>=', searchTerm.toLowerCase()),
        where('name', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        orderBy('name'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      console.log('Search results:', querySnapshot.docs.length);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Restaurant[];
    } catch (error) {
      console.error('Error searching restaurants:', error);
      throw new Error('Failed to search restaurants');
    }
  },

  async addRestaurant(name: string, address?: string): Promise<Restaurant> {
    if (!name?.trim()) {
      console.error('Restaurant name is empty');
      throw new Error('Restaurant name is required');
    }

    try {
      console.log('Adding restaurant:', { name, address });
      const restaurantsRef = collection(db, 'restaurants');
      
      // Check if restaurant already exists
      console.log('Checking if restaurant exists...');
      const existingQuery = query(
        restaurantsRef,
        where('name', '==', name.toLowerCase().trim())
      );
      
      const existingDocs = await getDocs(existingQuery);
      console.log('Existing docs found:', existingDocs.size);
      
      if (!existingDocs.empty) {
        console.log('Restaurant already exists, returning existing one');
        const existingDoc = existingDocs.docs[0];
        return {
          id: existingDoc.id,
          ...existingDoc.data(),
          createdAt: existingDoc.data().createdAt?.toDate(),
          updatedAt: existingDoc.data().updatedAt?.toDate(),
        } as Restaurant;
      }

      // Add new restaurant
      console.log('Creating new restaurant...');
      const now = serverTimestamp();
      const restaurantData = {
        name: name.toLowerCase().trim(),
        address: address?.trim() || '',
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(restaurantsRef, restaurantData);
      console.log('Restaurant added successfully with ID:', docRef.id);
      return {
        id: docRef.id,
        ...restaurantData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error in addRestaurant:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        if ('code' in error) {
          console.error('Firebase error code:', (error as any).code);
        }
      }
      throw new Error('Failed to add restaurant to database');
    }
  },

  async addMenuItem(restaurantId: string, menuItem: Omit<MenuItem, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>): Promise<MenuItem> {
    if (!menuItem.name?.trim()) {
      throw new Error('Menu item name is required');
    }

    try {
      console.log('Adding menu item:', { restaurantId, menuItem });
      const menuItemsRef = collection(db, `restaurants/${restaurantId}/menuItems`);
      
      // Check if menu item already exists
      const existingQuery = query(
        menuItemsRef,
        where('name', '==', menuItem.name.toLowerCase().trim())
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        console.log('Menu item already exists, returning existing one');
        const existingDoc = existingDocs.docs[0];
        return {
          id: existingDoc.id,
          restaurantId,
          ...existingDoc.data(),
          createdAt: existingDoc.data().createdAt?.toDate(),
          updatedAt: existingDoc.data().updatedAt?.toDate(),
        } as MenuItem;
      }

      const now = serverTimestamp();
      const menuItemData = {
        ...menuItem,
        name: menuItem.name.toLowerCase().trim(),
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(menuItemsRef, menuItemData);
      return {
        id: docRef.id,
        restaurantId,
        ...menuItemData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as MenuItem;
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw new Error('Failed to add menu item');
    }
  },

  async searchMenuItems(restaurantId: string, searchTerm: string): Promise<MenuItem[]> {
    if (!searchTerm.trim()) return [];

    try {
      console.log('Searching for menu items:', { restaurantId, searchTerm });
      const menuItemsRef = collection(db, `restaurants/${restaurantId}/menuItems`);
      const q = query(
        menuItemsRef,
        where('name', '>=', searchTerm.toLowerCase()),
        where('name', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        orderBy('name'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        restaurantId,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as MenuItem[];
    } catch (error) {
      console.error('Error searching menu items:', error);
      throw new Error('Failed to search menu items');
    }
  },

  async searchAllMenuItems(searchTerm: string): Promise<MenuItem[]> {
    if (!searchTerm.trim()) return [];

    try {
      console.log('Searching all menu items:', { searchTerm });
      const menuItemsRef = collectionGroup(db, 'menuItems');
      const q = query(
        menuItemsRef,
        where('name', '>=', searchTerm.toLowerCase()),
        where('name', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        orderBy('name'),
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const restaurantId = doc.ref.parent.parent!.id;
        return {
          id: doc.id,
          restaurantId,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        } as MenuItem;
      });
    } catch (error) {
      console.error('Error searching all menu items:', error);
      throw new Error('Failed to search menu items');
    }
  },

  async toggleFavorite(userId: string, restaurantName: string): Promise<boolean> {
    try {
      // Normalize the restaurant name to avoid issues with case sensitivity or extra spaces
      const normalizedName = restaurantName.trim();
      
      // Use a consistent document ID based on the restaurant name
      const favoritesRef = doc(db, `users/${userId}/favorites/${normalizedName}`);
      
      // Get the user document to update the main array too
      const userRef = doc(db, `users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error('User document not found');
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      const currentFavorites = userData.favoriteRestaurants || [];
      
      // Check if this restaurant is already favorited
      const docSnapshot = await getDoc(favoritesRef);
      
      if (docSnapshot.exists()) {
        // Restaurant is already a favorite, so remove it
        await deleteDoc(favoritesRef);
        
        // Also remove from the user document array
        const updatedFavorites = currentFavorites.filter((name: string) => name !== normalizedName);
        await updateDoc(userRef, {
          favoriteRestaurants: updatedFavorites,
          updatedAt: serverTimestamp()
        });
        
        console.log('Removed restaurant from favorites:', normalizedName);
        return false;
      } else {
        // Restaurant is not a favorite, so add it
        await setDoc(favoritesRef, {
          restaurantName: normalizedName,
          createdAt: serverTimestamp(),
        });
        
        // Add to the user document array if not already there
        if (!currentFavorites.includes(normalizedName)) {
          await updateDoc(userRef, {
            favoriteRestaurants: [...currentFavorites, normalizedName],
            updatedAt: serverTimestamp()
          });
        }
        
        console.log('Added restaurant to favorites:', normalizedName);
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw new Error('Failed to toggle favorite');
    }
  },

  // Helper function to check if the user can access favorites
  async canAccessFavorites(userId: string, currentUserId: string): Promise<boolean> {
    try {
      console.log(`Checking if user ${currentUserId} can access favorites of ${userId}`);
      
      // First check if this is the same user (which should always work)
      if (userId === currentUserId) {
        console.log('Self-access should always be permitted');
        return true;
      }
      
      // Next, check if the current user is a follower of the target user
      const targetUserRef = doc(db, `users/${userId}`);
      const targetUser = await getDoc(targetUserRef);
      
      if (!targetUser.exists()) {
        console.log('Target user does not exist');
        return false;
      }
      
      const userData = targetUser.data();
      const followers = userData.followers || [];
      
      console.log('Target user followers:', followers);
      const isFollower = followers.includes(currentUserId);
      console.log(`Is user ${currentUserId} a follower of ${userId}:`, isFollower);
      
      return isFollower;
    } catch (error) {
      console.error('Error checking access permissions:', error);
      return false;
    }
  },
  
  async getFavorites(userId: string, currentUserId?: string): Promise<string[]> {
    try {
      console.log('Getting favorites for user:', userId, 'Current user:', currentUserId);
      
      // For debugging, if currentUserId is provided, validate permissions first
      if (currentUserId) {
        const canAccess = await this.canAccessFavorites(userId, currentUserId);
        console.log('Permission check result:', canAccess);
        
        // If we're not ourselves and not a follower, we should expect a permission error
        if (!canAccess && userId !== currentUserId) {
          console.log('Expecting permission error based on our checks');
        }
      }
      
      // For debugging, if currentUserId is provided, check if they're following the target user
      if (currentUserId && currentUserId !== userId) {
        try {
          // Get the target user's profile to check followers
          const targetUserDocRef = doc(db, `users/${userId}`);
          const targetUserDoc = await getDoc(targetUserDocRef);
          
          if (targetUserDoc.exists()) {
            const targetUserData = targetUserDoc.data();
            const followers = targetUserData.followers || [];
            const isFollower = followers.includes(currentUserId);
            console.log(`Is current user (${currentUserId}) following target user (${userId}):`, isFollower);
            console.log('Target user followers:', followers);
          } else {
            console.log('Target user profile not found');
          }
        } catch (err) {
          console.error('Error checking follower status:', err);
        }
      }
      
      const favoritesRef = collection(db, `users/${userId}/favorites`);
      const favoritesSnapshot = await getDocs(favoritesRef);
      
      console.log('Favorites snapshot size:', favoritesSnapshot.size);
      
      // Return restaurant names from either the document ID or the restaurantName field
      const favorites = favoritesSnapshot.docs.map(doc => {
        // Log each document data and ID for debugging
        console.log('Favorite doc ID:', doc.id, 'Data:', doc.data());
        
        // First try to get from the restaurantName field
        const restaurantName = doc.data().restaurantName;
        // If that doesn't exist, use the document ID as fallback
        return restaurantName || doc.id;
      });
      
      console.log('Returning favorites:', favorites);
      return favorites;
    } catch (error) {
      console.error('Error getting favorites:', error);
      throw new Error('Failed to get favorites');
    }
  },

  // Workaround to get favorites for users when direct subcollection access is failing
  async getFavoritesWorkaround(userId: string, currentUserId?: string): Promise<string[]> {
    try {
      console.log('Using workaround to get favorites for user:', userId);
      
      // First try to get the user's profile document which should be accessible to followers
      const userRef = doc(db, `users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('User not found');
        return [];
      }
      
      const userData = userDoc.data();
      
      // Check if the profile has a favorites field
      if (userData.favoriteRestaurants && Array.isArray(userData.favoriteRestaurants)) {
        console.log('Found favoriteRestaurants array in user profile:', userData.favoriteRestaurants);
        return userData.favoriteRestaurants;
      } else {
        console.log('No favoriteRestaurants field in user profile, will try direct subcollection access');
        
        // Fall back to direct access method
        try {
          return await this.getFavorites(userId, currentUserId);
        } catch (error) {
          console.error('Fallback to direct access also failed:', error);
          return [];
        }
      }
    } catch (error) {
      console.error('Error in favorites workaround:', error);
      return [];
    }
  },
}; 
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
    if (!userId || !restaurantName) {
      console.error('Missing required parameters');
      throw new Error('User ID and restaurant name are required');
    }

    try {
      console.log('Toggling favorite for:', { userId, restaurantName });
      
      // Normalize the restaurant name to avoid issues with case sensitivity or extra spaces
      const normalizedName = restaurantName.trim().toLowerCase();
      console.log('Normalized restaurant name:', normalizedName);
      
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
      console.log('Current user data:', userData);
      const currentFavorites = userData.favoriteRestaurants || [];
      console.log('Current favorites array:', currentFavorites);
      
      // Check if this restaurant is already favorited
      const docSnapshot = await getDoc(favoritesRef);
      console.log('Favorite document exists:', docSnapshot.exists());
      
      if (docSnapshot.exists()) {
        // Restaurant is already a favorite, so remove it
        console.log('Removing restaurant from favorites');
        await deleteDoc(favoritesRef);
        
        // Also remove from the user document array
        const updatedFavorites = currentFavorites.filter((name: string) => 
          name.toLowerCase() !== normalizedName
        );
        console.log('Updated favorites array after removal:', updatedFavorites);
        
        await updateDoc(userRef, {
          favoriteRestaurants: updatedFavorites,
          updatedAt: serverTimestamp()
        });
        
        console.log('Successfully removed restaurant from favorites:', normalizedName);
        return false;
      } else {
        // Restaurant is not a favorite, so add it
        console.log('Adding restaurant to favorites');
        await setDoc(favoritesRef, {
          restaurantName: restaurantName.trim(), // Store original name but use normalized for ID
          normalizedName: normalizedName,
          createdAt: serverTimestamp(),
        });
        
        // Add to the user document array if not already there
        if (!currentFavorites.some((name: string) => name.toLowerCase() === normalizedName)) {
          const newFavorites = [...currentFavorites, restaurantName.trim()];
          console.log('Updated favorites array after addition:', newFavorites);
          
          await updateDoc(userRef, {
            favoriteRestaurants: newFavorites,
            updatedAt: serverTimestamp()
          });
        }
        
        console.log('Successfully added restaurant to favorites:', normalizedName);
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
      console.log('Getting favorites for user:', userId);
      
      // First check if we have permission to access the favorites
      if (currentUserId && userId !== currentUserId) {
        // Only check permissions if we're not accessing our own favorites
        const hasAccess = await this.canAccessFavorites(userId, currentUserId);
        if (!hasAccess) {
          console.log('User does not have permission to access favorites');
          return [];
        }
      }

      // Get favorites from both sources
      const favorites = new Set<string>();
      
      // 1. Check the user document array first
      const userRef = doc(db, `users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.favoriteRestaurants && Array.isArray(userData.favoriteRestaurants)) {
          userData.favoriteRestaurants.forEach(name => favorites.add(name));
        }
      }
      
      // 2. Check the favorites subcollection
      const favoritesRef = collection(db, `users/${userId}/favorites`);
      const favoritesSnapshot = await getDocs(favoritesRef);
      
      console.log('Favorites snapshot size:', favoritesSnapshot.size);
      
      // Add favorites from subcollection
      favoritesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        // First try to get from the restaurantName field
        const restaurantName = data.restaurantName;
        // If that doesn't exist, use the document ID as fallback
        favorites.add(restaurantName || doc.id);
      });
      
      const result = Array.from(favorites);
      console.log('Returning favorites:', result);
      return result;
    } catch (error) {
      console.error('Error getting favorites:', error);
      // Return empty array instead of throwing to prevent UI breaks
      return [];
    }
  },

  // Workaround to get favorites for users when direct subcollection access is failing
  async getFavoritesWorkaround(userId: string, currentUserId?: string): Promise<string[]> {
    try {
      console.log('Using workaround to get favorites for user:', userId);
      
      // Get the user's profile document
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
import { collection, query, where, getDocs, addDoc, orderBy, limit, serverTimestamp, doc, setDoc, collectionGroup, deleteDoc, getDoc, updateDoc, QueryConstraint } from 'firebase/firestore';
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
  // Utility function to normalize restaurant names
  normalizeRestaurantName(name: string): string {
    return name
      .toLowerCase() // convert to lowercase
      .trim() // remove leading/trailing spaces
      .replace(/\s+/g, '') // remove all spaces
      .replace(/[^a-z0-9]/g, ''); // remove special characters
  },

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
      const userRef = doc(db, `users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }

      const userData = userDoc.data();
      const favorites = userData.favoriteRestaurants || [];
      const normalizedName = this.normalizeRestaurantName(restaurantName.trim());
      
      // Check if restaurant is already favorited (using normalized comparison)
      const index = favorites.findIndex(
        (name: string) => this.normalizeRestaurantName(name) === normalizedName
      );
      
      let newFavorites;
      if (index === -1) {
        // Add to favorites (use original name for display)
        newFavorites = [...favorites, restaurantName.trim()];
      } else {
        // Remove from favorites
        newFavorites = favorites.filter((_: string, i: number) => i !== index);
      }

      // Update user document
      await updateDoc(userRef, {
        favoriteRestaurants: newFavorites
      });

      return index === -1; // Return true if added, false if removed
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
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

      // Get favorites from user document only
      const userRef = doc(db, `users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.favoriteRestaurants && Array.isArray(userData.favoriteRestaurants)) {
          return userData.favoriteRestaurants;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  },

  // Keep migration function separate - only call when needed for version updates
  async migrateFavorites(userId: string): Promise<void> {
    try {
      console.log('Starting favorites migration for user:', userId);
      const favorites = new Set<string>();
      
      // 1. Get favorites from user document
      const userRef = doc(db, `users/${userId}`);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.favoriteRestaurants && Array.isArray(userData.favoriteRestaurants)) {
          userData.favoriteRestaurants.forEach(name => favorites.add(name));
        }
      }
      
      // 2. Get favorites from subcollection
      const favoritesRef = collection(db, `users/${userId}/favorites`);
      const favoritesSnapshot = await getDocs(favoritesRef);
      
      // Add favorites from subcollection
      favoritesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const restaurantName = data.restaurantName || doc.id;
        favorites.add(restaurantName);
      });
      
      // 3. Update user document with consolidated favorites
      await updateDoc(userRef, {
        favoriteRestaurants: Array.from(favorites)
      });
      
      console.log('Favorites migration completed. Total favorites:', favorites.size);
    } catch (error) {
      console.error('Error during favorites migration:', error);
      throw error;
    }
  },

  async getRestaurantNotesCount(userId: string, restaurantName: string, currentUserId?: string): Promise<number> {
    try {
      // Create query to get notes for this restaurant
      const notesRef = collection(db, 'notes');
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        where('location.name', '==', restaurantName)
      ];

      // If viewing someone else's notes, respect privacy settings
      if (currentUserId && userId !== currentUserId) {
        const userRef = doc(db, `users/${userId}`);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.settings?.isPrivate) {
            if (!userData.followers?.includes(currentUserId)) {
              // If private and not following, only count public notes
              constraints.push(where('visibility', '==', 'public'));
            } else {
              // If private and following, count public and friends notes
              constraints.push(where('visibility', 'in', ['public', 'friends']));
            }
          }
        }
      }

      const q = query(notesRef, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting restaurant notes count:', error);
      return 0;
    }
  }
}; 
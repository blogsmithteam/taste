import { collection, query, where, getDocs, addDoc, orderBy, limit, serverTimestamp, doc, setDoc, collectionGroup } from 'firebase/firestore';
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
}; 
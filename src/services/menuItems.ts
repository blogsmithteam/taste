import { collection, query, where, getDocs, addDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MenuItem {
  id: string;
  name: string;
  restaurantId: string;
  restaurantName: string;
  count: number;  // Number of times this item has been ordered
  createdAt: Date;
  updatedAt: Date;
}

export const menuItemsService = {
  async searchMenuItems(searchTerm: string, restaurantName: string): Promise<MenuItem[]> {
    if (!searchTerm.trim() || !restaurantName) return [];

    try {
      console.log('Searching for menu items:', { searchTerm, restaurantName });
      const menuItemsRef = collection(db, 'menuItems');
      const q = query(
        menuItemsRef,
        where('restaurantName', '==', restaurantName.toLowerCase()),
        where('name', '>=', searchTerm.toLowerCase()),
        where('name', '<=', searchTerm.toLowerCase() + '\uf8ff'),
        orderBy('name'),
        orderBy('count', 'desc'),  // Show most ordered items first
        limit(5)
      );

      const querySnapshot = await getDocs(q);
      console.log('Search results:', querySnapshot.docs.length);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as MenuItem[];
    } catch (error) {
      console.error('Error searching menu items:', error);
      throw new Error('Failed to search menu items');
    }
  },

  async addMenuItem(name: string, restaurantId: string, restaurantName: string): Promise<MenuItem> {
    if (!name?.trim()) {
      throw new Error('Menu item name is required');
    }

    try {
      console.log('Adding menu item:', { name, restaurantName });
      const menuItemsRef = collection(db, 'menuItems');
      
      // Check if menu item already exists for this restaurant
      const existingQuery = query(
        menuItemsRef,
        where('restaurantName', '==', restaurantName.toLowerCase()),
        where('name', '==', name.toLowerCase().trim())
      );
      
      const existingDocs = await getDocs(existingQuery);
      
      if (!existingDocs.empty) {
        // Menu item exists, return it
        const existingDoc = existingDocs.docs[0];
        const existingData = existingDoc.data();
        
        return {
          id: existingDoc.id,
          ...existingData,
          createdAt: existingData.createdAt?.toDate(),
          updatedAt: existingData.updatedAt?.toDate(),
        } as MenuItem;
      }

      // Add new menu item
      const menuItemData = {
        name: name.toLowerCase().trim(),
        restaurantId,
        restaurantName: restaurantName.toLowerCase(),
        count: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(menuItemsRef, menuItemData);
      return {
        id: docRef.id,
        ...menuItemData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error adding menu item:', error);
      throw new Error('Failed to add menu item to database');
    }
  },

  async incrementCount(menuItemId: string): Promise<void> {
    // This will be called when a new note is created using this menu item
    // Implementation will be added when we update the note creation flow
  }
}; 
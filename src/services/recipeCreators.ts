import { collection, query, where, getDocs, addDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type RecipeCreatorType = 'person' | 'website' | 'book';

export interface RecipeCreator {
  id: string;
  name: string;
  type: RecipeCreatorType;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecipeCreator {
  name: string;
  type: RecipeCreatorType;
  url?: string;
}

export const recipeCreatorsService = {
  async searchRecipeCreators(searchTerm: string): Promise<RecipeCreator[]> {
    if (!searchTerm.trim()) return [];

    try {
      console.log('Searching for recipe creators:', searchTerm);
      const creatorsRef = collection(db, 'recipeCreators');
      const q = query(
        creatorsRef,
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
      })) as RecipeCreator[];
    } catch (error) {
      console.error('Error searching recipe creators:', error);
      throw new Error('Failed to search recipe creators');
    }
  },

  async addRecipeCreator(name: string, type: RecipeCreatorType = 'website', url?: string): Promise<RecipeCreator> {
    if (!name?.trim()) {
      throw new Error('Recipe creator name is required');
    }

    try {
      console.log('Adding recipe creator:', { name, type, url });
      const now = serverTimestamp();
      const docRef = await addDoc(collection(db, 'recipeCreators'), {
        name: name.trim(),
        type,
        url,
        createdAt: now,
        updatedAt: now
      });

      return {
        id: docRef.id,
        name: name.trim(),
        type,
        url,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding recipe creator:', error);
      throw error;
    }
  },
}; 
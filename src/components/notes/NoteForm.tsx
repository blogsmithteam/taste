import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '../auth/shared/FormInput';
import { Button } from '../auth/shared/Button';
import { Checkbox } from '../auth/shared/Checkbox';
import { Autocomplete } from '../shared/Autocomplete';
import { FoodRating } from '../shared/FoodRating';
import { TagInput } from '../shared/TagInput';
import { useAuth } from '../../contexts/AuthContext';
import { notesService, CreateNoteData, UpdateNoteData } from '../../services/notes';
import { restaurantsService } from '../../services/restaurants';
import { menuItemsService, MenuItem } from '../../services/menuItems';
import { recipeCreatorsService, RecipeCreator, RecipeCreatorType, CreateRecipeCreator } from '../../services/recipeCreators';
import { auth } from '../../lib/firebase';
import { Note } from '../../types/notes';
import { PhotoUpload } from '../photos/PhotoUpload';

interface RecipeCreatorFormData {
  id?: string;
  name?: string;
  type?: RecipeCreatorType;
  url?: string;
}

interface NoteFormData {
  type: 'restaurant' | 'recipe';
  title: string;
  menuItemId?: string;
  recipeCreator: RecipeCreatorFormData | null;
  rating: number;
  date: string;
  location: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  notes: string;
  tags: string[];
  improvements: string[];
  wouldOrderAgain: boolean;
  favorite: boolean;
  visibility: 'private' | 'friends' | 'public';
  photos: string[];
  recipeUrl?: string;
  shareRecipe?: boolean;
}

interface FormErrors {
  title?: string;
  type?: string;
  rating?: string;
  date?: string;
  location?: {
    name?: string;
    address?: string;
  };
  notes?: string;
  visibility?: string;
  recipeCreator?: string;
}

interface NoteFormProps {
  initialNote?: Note;
  onSuccess?: (note: Note) => void;
}

export const NoteForm: React.FC<NoteFormProps> = ({ initialNote, onSuccess }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<NoteFormData>({
    type: initialNote?.type || 'restaurant',
    title: initialNote?.title || '',
    rating: initialNote?.rating || 5,
    date: initialNote?.date ? initialNote.date.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: initialNote?.notes || '',
    tags: initialNote?.tags || [],
    improvements: initialNote?.improvements || [],
    wouldOrderAgain: initialNote?.wouldOrderAgain ?? true,
    favorite: initialNote?.favorite ?? false,
    visibility: initialNote?.visibility || 'friends',
    photos: initialNote?.photos || [],
    recipeCreator: null,  // Initialize as null since it's not part of the Note type
    location: {
      name: initialNote?.location?.name || '',
      address: initialNote?.location?.address || '',
      coordinates: initialNote?.location?.coordinates
    },
    recipeUrl: initialNote?.recipeUrl || '',
    shareRecipe: initialNote?.shareRecipe ?? false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = formData.type === 'restaurant' 
        ? 'What did you order?' 
        : 'What did you make?';
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
    }

    if (formData.type === 'recipe' && !formData.recipeCreator?.name) {
      newErrors.recipeCreator = 'Recipe creator is required';
    }

    if (!formData.rating || formData.rating < 1 || formData.rating > 5) {
      newErrors.rating = 'Rating must be between 1 and 5';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.visibility) {
      newErrors.visibility = 'Visibility is required';
    }

    // Validate restaurant name is set when type is restaurant
    if (formData.type === 'restaurant' && !formData.location?.name?.trim()) {
      newErrors.location = {
        name: 'Restaurant name is required',
      };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'location.address') {
      // Handle nested location.address update
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          address: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    }
  };

  const handleRestaurantSelect = async (restaurant: { name: string; address?: string }) => {
    setFormData(prev => ({
      ...prev,
      location: {
        name: restaurant.name,
        address: restaurant.address || '',
        coordinates: prev.location?.coordinates,
      },
      title: '',  // Clear the menu item title
      menuItemId: undefined  // Clear the menu item ID
    }));
  };

  const searchMenuItems = useCallback(
    async (searchTerm: string) => {
      if (!formData.location?.name) return [];
      return menuItemsService.searchMenuItems(searchTerm, formData.location.name);
    },
    [formData.location?.name]
  );

  const handleMenuItemSelect = async (item: MenuItem | { name: string }) => {
    if ('id' in item) {
      // Existing menu item selected
      setFormData(prev => ({
        ...prev,
        title: item.name,
        menuItemId: item.id
      }));
    } else {
      // New menu item being added
      try {
        if (!formData.location?.name) {
          throw new Error('Restaurant must be selected first');
        }
        
        // First get or create the restaurant
        const restaurants = await restaurantsService.searchRestaurants(formData.location.name);
        let restaurantId: string;
        
        if (restaurants.length > 0) {
          restaurantId = restaurants[0].id;
        } else {
          // Create new restaurant
          const newRestaurant = await restaurantsService.addRestaurant(
            formData.location.name,
            formData.location.address
          );
          restaurantId = newRestaurant.id;
        }
        
        const newMenuItem = await menuItemsService.addMenuItem(
          item.name,
          restaurantId,
          formData.location.name
        );
        
        setFormData(prev => ({
          ...prev,
          title: newMenuItem.name,
          menuItemId: newMenuItem.id
        }));
      } catch (error) {
        console.error('Error adding menu item:', error);
        // Still set the name but explicitly set menuItemId to undefined
        setFormData(prev => ({
          ...prev,
          title: item.name,
          menuItemId: undefined
        }));
      }
    }
  };

  const handleRecipeCreatorSelect = useCallback(async (creator: RecipeCreator | CreateRecipeCreator) => {
    if (!creator.name) {
      console.error('Recipe creator name is required');
      return;
    }

    const defaultType: RecipeCreatorType = 'website';

    if ('id' in creator) {
      // Existing creator selected
      const recipeCreator: RecipeCreatorFormData = {
        id: creator.id,
        name: creator.name,
        type: creator.type,
        url: creator.url
      };
      setFormData(prev => ({ 
        ...prev, 
        recipeCreator,
        // If it's a website, automatically add the URL to the recipeUrl field if available
        ...(creator.type === 'website' && creator.url ? { recipeUrl: creator.url } : {})
      }));
    } else {
      // New creator being added
      try {
        const type = creator.type ?? defaultType;
        // Only pass defined URL to the service
        const url = creator.url !== undefined ? creator.url : undefined;
        
        const newCreator = await recipeCreatorsService.addRecipeCreator(
          creator.name,
          type,
          url
        );
        const recipeCreator: RecipeCreatorFormData = {
          id: newCreator.id,
          name: newCreator.name,
          type: newCreator.type,
          url: newCreator.url
        };
        setFormData(prev => ({
          ...prev, 
          recipeCreator,
          // If it's a website, set the URL field if available
          ...(type === 'website' && newCreator.url ? { recipeUrl: newCreator.url } : {})
        }));
      } catch (error) {
        console.error('Error adding recipe creator:', error);
        const recipeCreator: RecipeCreatorFormData = {
          name: creator.name,
          type: creator.type ?? defaultType
        };
        setFormData(prev => ({ ...prev, recipeCreator }));
      }
    }
  }, []);

  const handleRecipeCreatorTypeChange = useCallback((newType: RecipeCreatorType) => {
    setFormData(prev => {
      const currentCreator = prev.recipeCreator;
      if (!currentCreator) return prev;

      const updatedCreator: RecipeCreatorFormData = {
        ...currentCreator,
        type: newType
      };

      return {
        ...prev,
        recipeCreator: updatedCreator,
        // Clear the recipeUrl if changing from website to another type
        ...(prev.recipeCreator?.type === 'website' && newType !== 'website' ? { recipeUrl: '' } : {})
      };
    });
  }, []);

  const handleRecipeCreatorUrlChange = useCallback((newUrl: string) => {
    setFormData(prev => {
      const currentCreator = prev.recipeCreator;
      if (!currentCreator) return prev;

      const updatedCreator: RecipeCreatorFormData = {
        ...currentCreator,
        url: newUrl
      };

      return {
        ...prev,
        recipeCreator: updatedCreator
      };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user) {
      setSubmitError('You must be logged in to save a note');
      return;
    }

    // Ensure we have a valid auth token
    try {
      const currentToken = await auth.currentUser?.getIdToken(true);
      if (!currentToken) {
        setSubmitError('Failed to authenticate. Please try logging in again.');
        return;
      }
    } catch (tokenError) {
      console.error('Error getting auth token:', tokenError);
      setSubmitError('Authentication error. Please try logging in again.');
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      // Clean up the form data to remove undefined values
      const cleanFormData = {
        ...formData,
        location: {
          name: formData.location.name || '',
          address: formData.location.address || '',
          // Only include coordinates if they exist and are valid
          ...(formData.location.coordinates?.latitude != null && formData.location.coordinates?.longitude != null
            ? { coordinates: formData.location.coordinates }
            : {})
        },
        // Include recipe-specific fields only if they have values
        ...(formData.recipeUrl ? { recipeUrl: formData.recipeUrl } : {}),
        ...(formData.shareRecipe ? { shareRecipe: formData.shareRecipe } : {})
      };

      if (formData.type === 'restaurant' && formData.location?.name) {
        try {
          await restaurantsService.addRestaurant(formData.location.name, formData.location.address);
        } catch (restaurantError) {
          console.error('Error adding restaurant:', restaurantError);
          setSubmitError('Failed to add restaurant. Please try again.');
          return;
        }
      } else if (formData.type === 'recipe' && formData.recipeCreator?.name) {
        try {
          // Only pass url if it's defined
          const creatorType = formData.recipeCreator.type || 'person';
          let creatorUrl: string | undefined = undefined;
          
          // Only include URL for website type creators or if URL is explicitly provided
          if (creatorType === 'website') {
            creatorUrl = formData.recipeUrl || undefined; // Use the recipeUrl field or undefined
          } else if (formData.recipeCreator.url) {
            creatorUrl = formData.recipeCreator.url;
          }
          
          await recipeCreatorsService.addRecipeCreator(
            formData.recipeCreator.name,
            creatorType,
            creatorUrl
          );
        } catch (creatorError) {
          console.error('Error adding recipe creator:', creatorError);
          setSubmitError('Failed to add recipe creator. Please try again.');
          return;
        }
      }

      let savedNote: Note;
      if (initialNote) {
        savedNote = await notesService.updateNote(initialNote.id, user.uid, {
          ...cleanFormData,
          id: initialNote.id,
          date: cleanFormData.date // The date string will be converted to Timestamp in the service
        } as UpdateNoteData);
      } else {
        savedNote = await notesService.createNote(user.uid, {
          ...cleanFormData,
          date: cleanFormData.date // The date string will be converted to Timestamp in the service
        });
      }

      setSuccessMessage('Note saved successfully!');
      if (onSuccess) {
        onSuccess(savedNote);
      } else {
        navigate('/app/tasting-notes');
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Type of Note
            </label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'restaurant' } } as any)}
                className={`flex-1 py-2 px-4 text-center transition-colors ${
                  formData.type === 'restaurant' 
                    ? 'bg-taste-primary text-white font-medium' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Restaurant
              </button>
              <button
                type="button"
                onClick={() => handleChange({ target: { name: 'type', value: 'recipe' } } as any)}
                className={`flex-1 py-2 px-4 text-center transition-colors ${
                  formData.type === 'recipe' 
                    ? 'bg-taste-primary text-white font-medium' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Recipe
              </button>
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-taste-primary focus:ring-taste-primary text-base"
            />
          </div>
        </div>

        {formData.type === 'restaurant' && (
          <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6 space-y-6">
            <Autocomplete
              label="Restaurant"
              value={formData.location.name}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, name: value }
              }))}
              onSelect={handleRestaurantSelect}
              searchFunction={restaurantsService.searchRestaurants}
              error={errors.location?.name}
              required
              allowNew
              newItemLabel="Add new restaurant"
              placeholder="e.g., Joe's Pizza"
            />

            <FormInput
              label="What did you eat?"
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="e.g., Margherita Pizza at Joe's"
            />

            <FormInput
              label="Address"
              type="text"
              name="location.address"
              value={formData.location.address}
              onChange={handleChange}
              error={errors.location?.address}
              placeholder="e.g., 123 Main St, New York, NY"
            />
          </div>
        )}

        {formData.type === 'recipe' && (
          <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6 space-y-6">
            <Autocomplete
              label="Recipe Creator"
              value={formData.recipeCreator?.name || ''}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                recipeCreator: { ...prev.recipeCreator, name: value }
              }))}
              onSelect={handleRecipeCreatorSelect}
              searchFunction={recipeCreatorsService.searchRecipeCreators}
              error={errors.recipeCreator}
              required
              allowNew
              newItemLabel="Add new recipe creator"
              placeholder="e.g., Alison Roman, NYT Cooking"
            />

            <FormInput
              label="What did you make?"
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="e.g., Homemade Lasagna"
              className="text-lg font-medium"
            />

            <div>
              <label className="block text-base font-semibold text-gray-800 mb-3">
                Creator Type
              </label>
              <select
                name="recipeCreator.type"
                value={formData.recipeCreator?.type || 'person'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  recipeCreator: { ...prev.recipeCreator, type: e.target.value as RecipeCreatorType }
                }))}
                className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-taste-primary focus:ring-taste-primary text-base"
              >
                <option value="person">Person</option>
                <option value="website">Website/Blog</option>
                <option value="book">Cookbook</option>
              </select>
            </div>

            <FormInput
              label="Recipe URL (optional)"
              type="url"
              name="recipeUrl"
              value={formData.recipeUrl || ''}
              onChange={handleChange}
              placeholder="e.g., https://cooking.nytimes.com/recipes/lasagna"
              helperText="Link to the original recipe"
            />
          </div>
        )}

        <div className="bg-white/80 rounded-lg shadow-sm border border-taste-primary/10 p-6 space-y-6">
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Rating
            </label>
            <FoodRating
              value={formData.rating}
              onChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}
            />
          </div>

          <FormInput
            label="Notes"
            type="textarea"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            error={errors.notes}
            placeholder="What did you think? How was the taste, texture, presentation?"
          />

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Tags
            </label>
            <TagInput
              tags={formData.tags}
              onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
              placeholder="Add tags (e.g., spicy, vegetarian)"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              What could be improved?
            </label>
            <TagInput
              tags={formData.improvements}
              onChange={(improvements) => setFormData(prev => ({ ...prev, improvements }))}
              placeholder="Add improvement suggestions"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Photos
            </label>
            <div className="bg-white rounded-lg shadow-sm border border-taste-primary/10 p-4">
              <PhotoUpload
                noteId={initialNote?.id || 'temp'}
                userId={user?.uid || ''}
                existingPhotos={formData.photos}
                onUploadComplete={(result) => {
                  setFormData(prev => ({
                    ...prev,
                    photos: [...prev.photos, result.url]
                  }));
                }}
                onError={(error) => {
                  setSubmitError(`Failed to upload photo: ${error.message}`);
                }}
              />
            </div>
          </div>

          <div>
            <Checkbox
              label={`Would eat again?`}
              name="wouldOrderAgain"
              checked={formData.wouldOrderAgain}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                wouldOrderAgain: e.target.checked
              }))}
            />
          </div>

          <div>
            <Checkbox
              label="Mark as favorite"
              name="favorite"
              checked={formData.favorite}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                favorite: e.target.checked
              }))}
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Visibility
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-taste-primary focus:ring-taste-primary text-base"
            >
              <option value="private">Private</option>
              <option value="friends">Friends</option>
              <option value="public">Public</option>
            </select>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-50 border border-green-100 p-4">
          <p className="text-sm text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/app/tasting-notes')}
          className="px-4 py-2 text-taste-primary bg-taste-primary/10 hover:bg-taste-primary hover:text-white transition-colors rounded-lg"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-taste-primary text-white rounded-lg hover:bg-taste-primary/90 transition-colors"
        >
          {isLoading ? 'Saving...' : initialNote ? 'Save Changes' : 'Create Note'}
        </Button>
      </div>
    </form>
  );
}; 
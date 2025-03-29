import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '../auth/shared/FormInput';
import { Button } from '../auth/shared/Button';
import { Checkbox } from '../auth/shared/Checkbox';
import { Autocomplete } from '../shared/Autocomplete';
import { FoodRating } from '../shared/FoodRating';
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
  location?: {
    name: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  notes: string;
  tags: string[];
  improvements: string[];
  wouldOrderAgain: boolean;
  visibility: 'private' | 'friends' | 'public';
  photos: string[];
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
    type: 'restaurant',
    title: '',
    rating: 5,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    tags: [],
    improvements: [],
    wouldOrderAgain: true,
    visibility: 'private',
    photos: [],
    recipeCreator: null
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialNote) {
      setFormData({
        type: initialNote.type,
        title: initialNote.title,
        rating: initialNote.rating,
        date: initialNote.date.toDate().toISOString().split('T')[0],
        notes: initialNote.notes,
        tags: initialNote.tags,
        improvements: initialNote.improvements,
        wouldOrderAgain: initialNote.wouldOrderAgain,
        visibility: initialNote.visibility,
        photos: initialNote.photos,
        recipeCreator: null, // This will be set if needed
        location: initialNote.location
      });
    }
  }, [initialNote]);

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

    if (!formData.notes.trim()) {
      newErrors.notes = 'Notes are required';
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
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
      setFormData(prev => ({ ...prev, recipeCreator }));
    } else {
      // New creator being added
      try {
        const type = creator.type ?? defaultType;
        const newCreator = await recipeCreatorsService.addRecipeCreator(
          creator.name,
          type
        );
        const recipeCreator: RecipeCreatorFormData = {
          id: newCreator.id,
          name: newCreator.name,
          type: newCreator.type,
          url: newCreator.url
        };
        setFormData(prev => ({ ...prev, recipeCreator }));
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
        recipeCreator: updatedCreator
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
          await recipeCreatorsService.addRecipeCreator(
            formData.recipeCreator.name,
            formData.recipeCreator.type,
            formData.recipeCreator.url
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
          ...formData,
          id: initialNote.id,
          date: formData.date // The date string will be converted to Timestamp in the service
        } as UpdateNoteData);
      } else {
        savedNote = await notesService.createNote(user.uid, {
          ...formData,
          date: formData.date // The date string will be converted to Timestamp in the service
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="restaurant">Restaurant</option>
            <option value="recipe">Recipe</option>
          </select>
          {errors.type && (
            <p className="mt-2 text-sm text-red-600">{errors.type}</p>
          )}
        </div>

        {formData.type === 'restaurant' && (
          <>
            <Autocomplete
              label="Restaurant Name"
              value={formData.location?.name || ''}
              onChange={(value) => setFormData(prev => ({
                ...prev,
                location: { ...prev.location, name: value },
                title: '',  // Clear the menu item when restaurant changes
                menuItemId: undefined
              }))}
              onSelect={handleRestaurantSelect}
              searchFunction={restaurantsService.searchRestaurants}
              error={errors.location?.name}
              required
              allowNew
              newItemLabel="Add new restaurant"
            />

            <FormInput
              label="Restaurant Address"
              type="text"
              name="location.address"
              value={formData.location?.address || ''}
              onChange={handleChange}
              error={errors.location?.address}
            />

            <Autocomplete
              label="What did you order?"
              value={formData.title}
              onChange={(value) => setFormData(prev => ({ ...prev, title: value, menuItemId: undefined }))}
              onSelect={handleMenuItemSelect}
              searchFunction={searchMenuItems}
              error={errors.title}
              required
              allowNew
              newItemLabel="Add new menu item"
              placeholder="e.g., Margherita Pizza, Pad Thai"
            />
          </>
        )}

        {formData.type === 'recipe' && (
          <>
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
              placeholder="e.g., Alison Roman, NYT Cooking, Joy of Cooking"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Creator Type
              </label>
              <select
                name="recipeCreator.type"
                value={formData.recipeCreator?.type || 'person'}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  recipeCreator: { ...prev.recipeCreator, type: e.target.value as RecipeCreatorType }
                }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="person">Person</option>
                <option value="website">Website/Blog</option>
                <option value="book">Cookbook</option>
              </select>
            </div>

            {formData.recipeCreator?.type === 'website' && (
              <FormInput
                label="Website URL"
                type="url"
                value={formData.recipeCreator?.url || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  recipeCreator: { ...prev.recipeCreator, url: e.target.value }
                }))}
                placeholder="e.g., https://cooking.nytimes.com"
              />
            )}

            <FormInput
              label="What did you make?"
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="e.g., Homemade Lasagna"
            />
          </>
        )}

        <FoodRating
          value={formData.rating}
          onChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}
          error={errors.rating}
        />

        <FormInput
          label="Date"
          type="date"
          name="date"
          required
          value={formData.date}
          onChange={handleChange}
          error={errors.date}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.notes && (
            <p className="mt-2 text-sm text-red-600">{errors.notes}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Visibility
          </label>
          <select
            name="visibility"
            value={formData.visibility}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="private">Private</option>
            <option value="friends">Friends</option>
            <option value="public">Public</option>
          </select>
          {errors.visibility && (
            <p className="mt-2 text-sm text-red-600">{errors.visibility}</p>
          )}
        </div>

        <Checkbox
          label="Would order again?"
          name="wouldOrderAgain"
          checked={formData.wouldOrderAgain}
          onChange={handleChange}
        />

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Photos
          </label>
          
          {/* Display existing photos */}
          {formData.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {formData.photos.map((photoUrl, index) => (
                <div key={photoUrl} className="relative group">
                  <img
                    src={photoUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        photos: prev.photos.filter(url => url !== photoUrl)
                      }));
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Photo upload component */}
          <PhotoUpload
            noteId={initialNote?.id || 'temp'}
            userId={user?.uid || ''}
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

      {submitError && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{submitError}</h3>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{successMessage}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/tasting-notes')}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : initialNote ? 'Save Changes' : 'Create Note'}
        </Button>
      </div>
    </form>
  );
}; 
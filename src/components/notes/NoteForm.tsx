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
    type: initialNote?.type || 'restaurant',
    title: initialNote?.title || '',
    rating: initialNote?.rating || 5,
    date: initialNote?.date ? initialNote.date.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: initialNote?.notes || '',
    tags: initialNote?.tags || [],
    improvements: initialNote?.improvements || [],
    wouldOrderAgain: initialNote?.wouldOrderAgain ?? true,
    visibility: initialNote?.visibility || 'private',
    photos: initialNote?.photos || [],
    recipeCreator: null,  // Initialize as null since it's not part of the Note type
    location: {
      name: initialNote?.location?.name || '',
      address: initialNote?.location?.address || '',
      coordinates: initialNote?.location?.coordinates
    }
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
        }
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="bg-white rounded p-3 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="block w-full rounded border-gray-200 shadow-sm focus:border-[#E07A5F] focus:ring-[#E07A5F] text-sm"
          >
            <option value="restaurant">Restaurant</option>
            <option value="recipe">Recipe</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-xs text-red-600">{errors.type}</p>
          )}
        </div>

        {formData.type === 'restaurant' &&
          <div className="bg-white rounded p-3 shadow-sm border border-gray-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Autocomplete
                  label="Restaurant Name"
                  value={formData.location?.name || ''}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, name: value },
                    title: '',
                    menuItemId: undefined
                  }))}
                  onSelect={handleRestaurantSelect}
                  searchFunction={restaurantsService.searchRestaurants}
                  error={errors.location?.name}
                  required
                  allowNew
                  newItemLabel="Add new restaurant"
                  placeholder="e.g., Luigi's Pizzeria"
                />
              </div>
              <div>
                <Autocomplete
                  label="What did you get?"
                  value={formData.title}
                  onChange={(value) => setFormData(prev => ({ ...prev, title: value, menuItemId: undefined }))}
                  onSelect={handleMenuItemSelect}
                  searchFunction={searchMenuItems}
                  error={errors.title}
                  required
                  allowNew
                  newItemLabel="Add new menu item"
                  placeholder="e.g., Margherita Pizza"
                />
                <div className="mt-2">
                  <Checkbox
                    label="I'd order again"
                    name="wouldOrderAgain"
                    checked={formData.wouldOrderAgain}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormInput
                  label="Date"
                  type="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  error={errors.date}
                />
              </div>
              <div>
                <FormInput
                  label="Address"
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  error={errors.location?.address}
                  placeholder="Restaurant address"
                />
              </div>
            </div>
          </div>
        }

        {formData.type === 'recipe' && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 space-y-6">
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
                className="block w-full rounded-lg border-gray-200 shadow-sm focus:border-[#E07A5F] focus:ring-[#E07A5F] text-base"
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
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded p-3 shadow-sm border border-gray-100 h-[150px] flex flex-col">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Share your thoughts about the dish..."
              className="block w-full flex-1 rounded border-gray-200 shadow-sm focus:border-[#E07A5F] focus:ring-[#E07A5F] text-sm resize-none"
            />
            {errors.notes && (
              <p className="mt-1 text-xs text-red-600">{errors.notes}</p>
            )}
          </div>

          <div className="bg-white rounded p-3 shadow-sm border border-gray-100 flex flex-col">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Photos
            </label>
            <div className="flex-1">
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
              {formData.photos.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">
                    {formData.photos.length} {formData.photos.length === 1 ? 'photo' : 'photos'} attached
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {formData.photos.map((photoUrl, index) => (
                      <div key={photoUrl} className="relative group aspect-square">
                        <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={photoUrl}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              console.error('Failed to load image:', photoUrl);
                              e.currentTarget.src = 'https://via.placeholder.com/300?text=Failed+to+load';
                            }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity" />
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to remove this photo? This cannot be undone.')) {
                                setFormData(prev => ({
                                  ...prev,
                                  photos: prev.photos.filter(url => url !== photoUrl)
                                }));
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 hover:bg-red-600"
                            title="Remove photo"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded p-3 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Rating
            </label>
            <FoodRating
              value={formData.rating}
              onChange={(value) => setFormData(prev => ({ ...prev, rating: value }))}
              error={errors.rating}
            />
          </div>
          <div className="bg-white rounded p-3 shadow-sm border border-gray-100">
            <label className="block text-sm font-medium text-gray-800 mb-2">
              Visibility
            </label>
            <select
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="block w-full rounded border-gray-200 shadow-sm focus:border-[#E07A5F] focus:ring-[#E07A5F] text-sm"
            >
              <option value="private">Only Me</option>
              <option value="friends">Friends</option>
              <option value="public">Public</option>
            </select>
            {errors.visibility && (
              <p className="mt-1 text-xs text-red-600">{errors.visibility}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded p-3 shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Tags
          </label>
          <TagInput
            tags={formData.tags}
            onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
            placeholder="e.g., Italian, Pizza, Spicy (comma separated)"
          />
        </div>
      </div>

      {submitError && (
        <div className="rounded bg-red-50 p-2 border border-red-100">
          <div className="flex">
            <div className="ml-2">
              <h3 className="text-xs font-medium text-red-800">{submitError}</h3>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="rounded bg-green-50 p-2 border border-green-100">
          <div className="flex">
            <div className="ml-2">
              <h3 className="text-xs font-medium text-green-800">{successMessage}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate('/app/tasting-notes')}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-gradient-to-r from-[#E07A5F] to-[#81375E] hover:from-[#81375E] hover:to-[#3D405B] text-white"
        >
          {isLoading ? 'Saving...' : initialNote ? 'Save Changes' : 'Create Note'}
        </Button>
      </div>
    </form>
  );
}; 
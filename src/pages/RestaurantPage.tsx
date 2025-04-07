import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Note, notesService } from '../services/notes';
import { useAuth } from '../contexts/AuthContext';
import { NoteCard } from '../components/notes/NoteCard';
import { BuildingStorefrontIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Restaurant {
  id: string;
  name: string;
  address?: string;
  visitCount: number;
  averageRating?: number;
  lastVisited?: Date;
  notes?: Note[];
}

const RestaurantPage: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Utility function to normalize restaurant names
  const normalizeRestaurantName = (name: string): string => {
    return name
      .toLowerCase() // convert to lowercase
      .trim() // remove leading/trailing spaces
      .replace(/\s+/g, '') // remove all spaces
      .replace(/[^a-z0-9]/g, ''); // remove special characters
  };

  useEffect(() => {
    const fetchRestaurantData = async () => {
      if (!user || !restaurantId) return;

      try {
        setIsLoading(true);
        const { notes: userNotes } = await notesService.fetchNotes(user.uid);
        console.log('Debug - Note fetching:', {
          userId: user.uid,
          totalNotes: userNotes.length,
          allNotes: userNotes.map(note => ({
            id: note.id,
            title: note.title,
            type: note.type,
            location: note.location,
            visibility: note.visibility,
            userId: note.userId
          }))
        });
        
        // Decode the restaurant name from the URL
        const decodedRestaurantName = decodeURIComponent(restaurantId);
        const searchNormalized = normalizeRestaurantName(decodedRestaurantName);
        console.log('Looking for restaurant:', {
          original: decodedRestaurantName,
          normalized: searchNormalized
        });
        
        // Filter notes for this restaurant
        const restaurantNotes = userNotes.filter(note => {
          if (note.type !== 'restaurant' || !note.location?.name) {
            console.log('Debug - Skipping note:', {
              id: note.id,
              type: note.type,
              hasLocation: !!note.location,
              hasName: !!note.location?.name
            });
            return false;
          }
          const locationNormalized = normalizeRestaurantName(note.location.name);
          const matches = locationNormalized === searchNormalized;
          console.log('Debug - Comparing restaurant:', {
            noteId: note.id,
            original: {
              location: note.location.name,
              searching: decodedRestaurantName
            },
            normalized: {
              location: locationNormalized,
              search: searchNormalized
            },
            matches
          });
          return matches;
        });

        console.log('Found restaurant notes:', restaurantNotes);

        if (restaurantNotes.length === 0) {
          console.log('No notes found for restaurant:', {
            searching: decodedRestaurantName,
            normalized: searchNormalized,
            availableRestaurants: userNotes
              .filter(note => note.type === 'restaurant' && note.location?.name)
              .map(note => ({
                name: note.location!.name,
                normalized: normalizeRestaurantName(note.location!.name)
              }))
          });
          setError('Restaurant not found');
          setIsLoading(false);
          return;
        }

        // Calculate restaurant stats
        const rating = restaurantNotes.reduce((sum, note) => sum + note.rating, 0) / restaurantNotes.length;
        const lastVisited = restaurantNotes.reduce((latest, note) => {
          const noteDate = note.date.toDate();
          return latest > noteDate ? latest : noteDate;
        }, new Date(0));

        // Get restaurant details from the first note
        const firstNote = restaurantNotes[0];
        setRestaurant({
          id: restaurantId,
          name: firstNote.location!.name,
          address: firstNote.location?.address,
          visitCount: restaurantNotes.length,
          averageRating: rating,
          lastVisited,
          notes: restaurantNotes.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())
        });
      } catch (err) {
        console.error('Error fetching restaurant data:', err);
        setError('Failed to load restaurant data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurantData();
  }, [user, restaurantId]);

  const handleNoteClick = (noteId: string) => {
    navigate(`/app/notes/${noteId}`, { state: { from: `/app/restaurants/${restaurantId}` } });
  };

  const handleBackClick = () => {
    const { from, userId } = location.state || {};
    if (from === 'profile' && userId) {
      navigate(`/app/users/${userId}`);
    } else {
      navigate('/app/restaurants');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF1ED] flex items-center justify-center">
        <p className="text-taste-primary/60 text-lg">Please log in to view restaurant details.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E76F51]"></div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={handleBackClick}
            className="inline-flex items-center text-[#E76F51] hover:text-[#E76F51]/80 transition-colors mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>
              {location.state?.from === 'profile' ? 'Back to Profile' : 'Back to Restaurants'}
            </span>
          </button>

          <div className="bg-white rounded-lg shadow-sm border border-[#E76F51]/10 p-6 text-center">
            <p className="text-[#E76F51]/60 text-lg">{error || 'Restaurant not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={handleBackClick}
          className="inline-flex items-center text-[#E76F51] hover:text-[#E76F51]/80 transition-colors mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          <span>
            {location.state?.from === 'profile' ? 'Back to Profile' : 'Back to Restaurants'}
          </span>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-[#E76F51]/10 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-4xl font-semibold text-[#E76F51] mb-2">{restaurant.name}</h1>
              {restaurant.address && (
                <p className="text-gray-600 text-lg mb-4">{restaurant.address}</p>
              )}
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-gray-500">Total Visits</p>
                  <p className="text-2xl font-medium text-gray-900">{restaurant.visitCount}</p>
                </div>
                {restaurant.averageRating !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <p className="text-2xl font-medium text-gray-900">
                      {Math.round(restaurant.averageRating * 10) / 10}/5
                    </p>
                  </div>
                )}
                {restaurant.lastVisited && (
                  <div>
                    <p className="text-sm text-gray-500">Last Visited</p>
                    <p className="text-lg text-gray-900">
                      {restaurant.lastVisited.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <BuildingStorefrontIcon className="h-8 w-8 text-[#E76F51]" />
          </div>
        </div>

        <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">Tasting Notes</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {restaurant.notes?.map(note => (
            <div key={note.id} onClick={() => handleNoteClick(note.id)} className="card-hover">
              <NoteCard 
                note={note} 
                showWouldOrderAgain={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantPage; 
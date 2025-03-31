import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { notesService, Note } from '../services/notes';
import { restaurantsService } from '../services/restaurants';
import { BuildingStorefrontIcon, ArrowLeftIcon, HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { Timestamp } from 'firebase/firestore';
import { NoteCard } from '../components/notes/NoteCard';

interface Restaurant {
  id: string;
  name: string;
  address?: string;
  visitCount: number;
  averageRating?: number;
  lastVisited?: Date;
  notes?: Note[];
}

const RestaurantsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        // Get user notes first
        const userNotes = await notesService.getUserNotes(user.uid);
        
        // Try to get favorites, but don't let it block loading restaurants
        try {
          const userFavorites = await restaurantsService.getFavorites(user.uid);
          setFavorites(userFavorites);
        } catch (favError) {
          console.error('Error fetching favorites:', favError);
          // Don't set error state for favorites failure
          setFavorites([]);
        }
        
        // Extract unique restaurants from notes
        const restaurantMap = new Map<string, Restaurant>();
        
        userNotes.forEach(note => {
          if (note.location?.name) {
            const existing = restaurantMap.get(note.location.name);
            const rating = note.rating || 0;
            const createdDate = note.createdAt instanceof Timestamp ? note.createdAt.toDate() : note.createdAt;
            
            if (existing) {
              existing.visitCount += 1;
              existing.averageRating = ((existing.averageRating || 0) * (existing.visitCount - 1) + rating) / existing.visitCount;
              if (createdDate && (!existing.lastVisited || createdDate > existing.lastVisited)) {
                existing.lastVisited = createdDate;
              }
              existing.notes = existing.notes || [];
              existing.notes.push(note);
            } else {
              restaurantMap.set(note.location.name, {
                id: note.location.name, // Using name as ID for now
                name: note.location.name,
                address: note.location.address,
                visitCount: 1,
                averageRating: rating,
                lastVisited: createdDate,
                notes: [note]
              });
            }
          }
        });

        const sortedRestaurants = Array.from(restaurantMap.values())
          .sort((a, b) => (b.lastVisited?.getTime() || 0) - (a.lastVisited?.getTime() || 0));
        
        // Sort notes within each restaurant by date
        sortedRestaurants.forEach(restaurant => {
          if (restaurant.notes) {
            restaurant.notes.sort((a, b) => {
              const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : a.createdAt;
              const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : b.createdAt;
              return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
            });
          }
        });
        
        setRestaurants(sortedRestaurants);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load restaurants');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/app/notes/${noteId}`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent, restaurantName: string) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const isFavorited = await restaurantsService.toggleFavorite(user.uid, restaurantName);
      if (isFavorited) {
        setFavorites(prev => [...prev, restaurantName]);
      } else {
        setFavorites(prev => prev.filter(name => name !== restaurantName));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setError('Failed to update favorite');
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDF1ED] flex items-center justify-center">
        <p className="text-taste-primary/60 text-lg">Please log in to view restaurants.</p>
      </div>
    );
  }

  if (selectedRestaurant) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setSelectedRestaurant(null)}
            className="inline-flex items-center text-[#E76F51] hover:text-[#E76F51]/80 transition-colors mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Back to Restaurants</span>
          </button>

          <div className="bg-white rounded-lg shadow-sm border border-[#E76F51]/10 p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-serif text-4xl font-semibold text-[#E76F51] mb-2">{selectedRestaurant.name}</h1>
                {selectedRestaurant.address && (
                  <p className="text-gray-600 text-lg mb-4">{selectedRestaurant.address}</p>
                )}
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Total Visits</p>
                    <p className="text-2xl font-medium text-gray-900">{selectedRestaurant.visitCount}</p>
                  </div>
                  {selectedRestaurant.averageRating !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Average Rating</p>
                      <p className="text-2xl font-medium text-gray-900">
                        {Math.round(selectedRestaurant.averageRating)}/5
                      </p>
                    </div>
                  )}
                  {selectedRestaurant.lastVisited && (
                    <div>
                      <p className="text-sm text-gray-500">Last Visited</p>
                      <p className="text-lg text-gray-900">
                        {selectedRestaurant.lastVisited.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <BuildingStorefrontIcon className="h-8 w-8 text-[#E76F51]" />
            </div>
          </div>

          <h2 className="text-2xl font-serif font-semibold text-gray-900 mb-6">Tasting Notes</h2>
          <div className="grid gap-4">
            {selectedRestaurant.notes?.map(note => (
              <div key={note.id} onClick={() => handleNoteClick(note.id)} className="card-hover">
                <NoteCard note={note} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-serif text-5xl font-semibold text-[#E76F51] mb-2">My Restaurants</h1>
            <p className="text-black text-xl">Places you've visited and reviewed</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#E76F51] focus:ring-1 focus:ring-[#E76F51] focus:outline-none transition-colors pl-10"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-[#E76F51]/5 border border-[#E76F51]/20 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-[#E76F51]">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E76F51]"></div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRestaurants.map(restaurant => (
              <div
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant)}
                className="bg-white rounded-lg shadow-sm border border-[#E76F51]/10 p-6 hover:shadow-md transition-shadow cursor-pointer relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 mb-1">{restaurant.name}</h3>
                    {restaurant.address && (
                      <p className="text-gray-500 text-sm mb-2">{restaurant.address}</p>
                    )}
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{restaurant.visitCount} visits</span>
                      {restaurant.averageRating !== undefined && (
                        <span>{Math.round(restaurant.averageRating)}/5 rating</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleFavoriteClick(e, restaurant.name)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {favorites.includes(restaurant.name) ? (
                      <HeartIconSolid className="h-6 w-6 text-[#E76F51]" />
                    ) : (
                      <HeartIcon className="h-6 w-6 text-[#E76F51] opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantsPage; 
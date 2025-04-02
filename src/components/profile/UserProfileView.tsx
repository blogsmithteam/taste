import React, { useEffect, useState } from 'react';
import { User } from '../../types/user';
import { userService } from '../../services/user';
import { FollowButton } from './FollowButton';
import { FamilyButton } from './FamilyButton';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LinkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { notesService, Note } from '../../services/notes';
import { StarIcon } from '@heroicons/react/24/outline';
import { NoteCard } from '../notes/NoteCard';
import { restaurantsService } from '../../services/restaurants';
import { PendingFollowRequests } from './PendingFollowRequests';

interface UserProfileViewProps {
  userId: string;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ userId }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [restaurantFilter, setRestaurantFilter] = useState('');
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const userProfile = await userService.getUserProfile(userId);
        if (!userProfile) {
          setError('Profile not found');
          setLoading(false);
          return;
        }

        setProfile(userProfile);
      } catch (err) {
        setError('Failed to load profile');
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, user]);

  // Determine what content can be shown based on privacy settings
  const canViewFullProfile = !profile?.settings?.isPrivate || 
                           user?.uid === profile?.id || 
                           profile?.followers?.includes(user?.uid || '');

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!profile) return;
      
      try {
        setLoadingFollowers(true);
        // Only fetch followers if we have access to the profile
        if (!profile.settings?.isPrivate || user?.uid === profile.id || profile.followers?.includes(user?.uid || '')) {
          const followersList = await userService.getFollowers(userId);
          setFollowers(followersList);
        }
      } catch (err) {
        console.error('Error loading followers:', err);
      } finally {
        setLoadingFollowers(false);
      }
    };

    const fetchFollowing = async () => {
      if (!profile) return;
      
      try {
        setLoadingFollowing(true);
        // Only fetch following if we have access to the profile
        if (!profile.settings?.isPrivate || user?.uid === profile.id || profile.followers?.includes(user?.uid || '')) {
          const followingList = await userService.getFollowing(userId);
          setFollowing(followingList);
        }
      } catch (err) {
        console.error('Error loading following:', err);
      } finally {
        setLoadingFollowing(false);
      }
    };

    const fetchFamilyMembers = async () => {
      if (!profile) return;
      
      try {
        setLoadingFamily(true);
        // Only fetch family members if we have access to the profile
        if (!profile.settings?.isPrivate || user?.uid === profile.id || profile.followers?.includes(user?.uid || '')) {
          const familyMembersList = await userService.getFamilyMembers(userId);
          setFamilyMembers(familyMembersList);
        }
      } catch (err) {
        console.error('Error loading family members:', err);
      } finally {
        setLoadingFamily(false);
      }
    };

    const fetchUserNotes = async () => {
      if (!profile || !user) return;
      
      try {
        setLoadingNotes(true);
        
        // Different approaches based on whether this is the user's own profile or someone else's
        if (userId === user.uid) {
          // For the user's own profile, get all their notes
          const { notes } = await notesService.fetchNotes(userId, {
            sortBy: 'date',
            sortDirection: 'desc'
          });
          setRecentNotes(notes);
        } else {
          // For someone else's profile, check if we can access their notes
          if (!profile.settings?.isPrivate || profile.followers?.includes(user.uid)) {
            // If we're following them or profile is public, get their friends + public notes
            const { notes: friendsNotes } = await notesService.fetchSharedWithMe(user.uid, {
              filters: { userId: userId },
              sortBy: 'date',
              sortDirection: 'desc'
            });
            setRecentNotes(friendsNotes);
          } else {
            // If we're not following them and profile is private, only get public notes
            const { notes: publicNotes } = await notesService.fetchPublicNotes({
              filters: { userId: userId },
              sortBy: 'date',
              sortDirection: 'desc'
            });
            setRecentNotes(publicNotes);
          }
        }
      } catch (err) {
        console.error('Error loading notes:', err);
      } finally {
        setLoadingNotes(false);
      }
    };

    const fetchFavoriteRestaurants = async () => {
      if (!profile || !user) return;
      
      try {
        // Only fetch favorite restaurants if we have access to the profile
        if (!profile.settings?.isPrivate || user.uid === profile.id || profile.followers?.includes(user.uid)) {
          console.log('Fetching favorite restaurants for user:', userId);
          console.log('Current user:', user.uid);
          
          let favorites: string[] = [];
          
          try {
            favorites = await restaurantsService.getFavoritesWorkaround(userId, user.uid);
            console.log('Favorite restaurants fetched via workaround:', favorites);
          } catch (innerErr) {
            console.error('Workaround failed, trying direct method:', innerErr);
            
            try {
              favorites = await restaurantsService.getFavorites(userId, user.uid);
              console.log('Favorite restaurants fetched via direct method:', favorites);
            } catch (directErr) {
              console.error('All methods to fetch favorites failed:', directErr);
              favorites = [];
            }
          }
          
          setFavoriteRestaurants(favorites);
        }
      } catch (err) {
        console.error('Error loading favorite restaurants:', err);
        setFavoriteRestaurants([]);
      }
    };

    fetchFollowers();
    fetchFollowing();
    fetchFamilyMembers();
    fetchUserNotes();
    fetchFavoriteRestaurants();
  }, [userId, user, profile]);

  const handleCopyProfileLink = async () => {
    const profileUrl = `${window.location.origin}/app/users/${userId}`;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy profile link:', err);
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/app/users/${userId}`);
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/app/notes/${noteId}`);
  };

  // Only show pending requests if this is the user's own profile and they have private profile enabled
  const showPendingRequests = user?.uid === userId && profile?.settings?.isPrivate;

  if (loading) {
    return (
      <div className="section-container">
        <div className="section-inner">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-taste-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="section-container">
        <div className="section-inner">
          <div className="bg-white/80 rounded-xl shadow-sm p-6">
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error || 'Profile not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-container">
      <div className="section-inner">
        <div className="space-y-12">
          {/* Basic Information Section */}
          <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="ml-0">
                    <h1>{profile.username}</h1>
                    {canViewFullProfile && <p className="text-gray-500">{profile.email}</p>}
                    {canViewFullProfile ? (
                      <div className="flex items-center space-x-6 mt-2">
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold text-taste-primary">{profile.followers?.length || 0}</p>
                          <button
                            onClick={() => navigate(`/app/users/${userId}/followers`)}
                            className="text-gray-500 hover:text-taste-primary transition-colors"
                          >
                            {profile.followers?.length === 1 ? 'Follower' : 'Followers'}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold text-taste-primary">{profile.following?.length || 0}</p>
                          <button
                            onClick={() => navigate(`/app/users/${userId}/following`)}
                            className="text-gray-500 hover:text-taste-primary transition-colors"
                          >
                            Following
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">This profile is private. Follow to see more details.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  {canViewFullProfile && (
                    <>
                      <button
                        onClick={handleCopyProfileLink}
                        className="btn-secondary inline-flex items-center"
                      >
                        <LinkIcon className="h-4 w-4 mr-1" />
                        Share Profile
                      </button>
                      <FamilyButton targetUserId={userId} />
                    </>
                  )}
                  <FollowButton targetUserId={userId} />
                </div>
              </div>

              {profile.bio && canViewFullProfile && (
                <div className="mt-8">
                  <h2>Bio</h2>
                  <p className="descriptive-text mt-2">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Follow Requests Section - Only shown on own private profile */}
          {showPendingRequests && (
            <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
              <div className="p-8">
                <h2 className="font-serif text-2xl font-semibold text-[#E76F51] mb-6">
                  Pending Follow Requests
                </h2>
                <PendingFollowRequests />
              </div>
            </div>
          )}

          {/* Only show these sections if user has full access */}
          {canViewFullProfile && (
            <>
              {/* Dietary Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dietary Preferences Section */}
                {profile.dietaryPreferences && profile.dietaryPreferences.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
                    <div className="p-8">
                      <h2 className="font-serif text-2xl font-semibold text-[#E76F51]">Dietary Preferences</h2>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {profile.dietaryPreferences.map((pref: string) => (
                          <span
                            key={pref}
                            className="tag-pill"
                          >
                            {pref}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Allergies Section */}
                {profile.allergies && profile.allergies.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
                    <div className="p-8">
                      <h2 className="font-serif text-2xl font-semibold text-[#E76F51]">Allergies</h2>
                      <div className="mt-6 flex flex-wrap gap-2">
                        {profile.allergies.map((allergy: string) => (
                          <span
                            key={allergy}
                            className="tag-pill"
                          >
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Family Section */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
                <div className="p-8">
                  <div className="flex items-center justify-between">
                    <h2>Family</h2>
                    {familyMembers.length > 0 && (
                      <button
                        onClick={() => navigate(`/app/users/${userId}/family`)}
                        className="text-sm text-taste-primary hover:text-taste-primary-dark font-medium"
                      >
                        View all family members
                      </button>
                    )}
                  </div>

                  {familyMembers.length === 0 ? (
                    <p className="text-gray-500 mt-4">No family members yet</p>
                  ) : (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {familyMembers.slice(0, 3).map((familyMember) => (
                        <div
                          key={familyMember.id}
                          className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => handleUserClick(familyMember.id)}
                        >
                          <div className="flex items-center space-x-4">
                            <div>
                              <h3 className="font-medium text-gray-900">{familyMember.username}</h3>
                              {familyMember.bio && (
                                <p className="text-sm text-gray-500 line-clamp-1">{familyMember.bio}</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            {familyMember.dietaryPreferences && familyMember.dietaryPreferences.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {familyMember.dietaryPreferences.map((pref) => (
                                  <span
                                    key={pref}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    {pref}
                                  </span>
                                ))}
                              </div>
                            )}

                            {familyMember.allergies && familyMember.allergies.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {familyMember.allergies.map((allergy) => (
                                  <span
                                    key={allergy}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                  >
                                    {allergy}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Favorites Section */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
                <div className="p-8">
                  <h2 className="font-serif text-2xl font-semibold text-[#E76F51] mb-6">Favorites</h2>

                  {/* Favorite Meals Subsection */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Favorite Meals</h3>
                    {recentNotes
                      .filter(note => note.favorite)
                      .filter(note => 
                        !restaurantFilter || 
                        note.location?.name?.toLowerCase().includes(restaurantFilter.toLowerCase())
                      ).length === 0 ? (
                      <p className="text-gray-500">No favorite meals yet</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentNotes
                          .filter(note => note.favorite)
                          .filter(note => 
                            !restaurantFilter || 
                            note.location?.name?.toLowerCase().includes(restaurantFilter.toLowerCase())
                          )
                          .slice(0, 6)
                          .map(note => (
                            <div 
                              key={note.id} 
                              onClick={() => handleNoteClick(note.id)} 
                              className="bg-white rounded-lg p-3 border border-gray-100 hover:border-taste-primary/20 hover:shadow-sm transition-all cursor-pointer"
                            >
                              <h4 className="font-medium text-taste-primary mb-1 line-clamp-1">{note.title}</h4>
                              {note.location?.name && (
                                <div className="text-sm text-gray-600 line-clamp-1">
                                  {note.location.name}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Favorite Restaurants Subsection */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Favorite Restaurants</h3>
                    {favoriteRestaurants
                      .filter(restaurantName => 
                        !restaurantFilter || 
                        restaurantName.toLowerCase().includes(restaurantFilter.toLowerCase())
                      ).length === 0 ? (
                      <p className="text-gray-500">
                        {restaurantFilter ? 'No favorite restaurants found matching your search' : 'No favorite restaurants yet'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {favoriteRestaurants
                          .filter(restaurantName => 
                            !restaurantFilter || 
                            restaurantName.toLowerCase().includes(restaurantFilter.toLowerCase())
                          )
                          .slice(0, 6)
                          .map(restaurantName => {
                            const restaurantNotes = recentNotes
                              .filter(note => 
                                note.location?.name && 
                                note.location.name.toLowerCase() === restaurantName.toLowerCase()
                              )
                              .sort((a, b) => b.rating - a.rating);
                            const bestNote = restaurantNotes[0];
                            
                            return (
                              <div 
                                key={restaurantName} 
                                onClick={() => bestNote ? handleNoteClick(bestNote.id) : null}
                                className="bg-white rounded-lg shadow-sm border border-taste-primary/10 p-4 hover:shadow-md transition-shadow cursor-pointer"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="text-lg font-medium text-taste-primary">{restaurantName}</h4>
                                  {bestNote && (
                                    <div className="flex items-center">
                                      <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                                      <span className="ml-1 text-sm text-gray-600">{bestNote.rating}/5</span>
                                    </div>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {restaurantNotes.length} {restaurantNotes.length === 1 ? 'note' : 'notes'}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Notes Section */}
              {recentNotes.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-[#E76F51]/10">
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="font-serif text-2xl font-semibold text-[#E76F51]">Recent Notes</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {recentNotes
                        .filter(note => !note.favorite)
                        .slice(0, 4)
                        .map(note => (
                          <div
                            key={note.id}
                            onClick={() => handleNoteClick(note.id)}
                            className="cursor-pointer group"
                          >
                            <div className="bg-white rounded-lg border border-gray-100 p-4 transition-all duration-200 hover:border-[#E76F51]/20 hover:shadow-sm">
                              <h3 className="font-medium text-gray-900 group-hover:text-[#E76F51] transition-colors">
                                {note.title}
                              </h3>
                              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                <time dateTime={note.date.toDate().toISOString()}>
                                  {format(note.date.toDate(), 'MMM d, yyyy')}
                                </time>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, index) => (
                                    <StarIcon
                                      key={index}
                                      className={`h-4 w-4 ${
                                        index < note.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {note.tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {note.tags.slice(0, 3).map(tag => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {note.tags.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                      +{note.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Toast notification for copied link */}
        {showCopiedToast && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg">
            Profile link copied to clipboard!
          </div>
        )}
      </div>
    </div>
  );
};
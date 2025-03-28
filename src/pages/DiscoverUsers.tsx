import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, limit, getDocs, orderBy, startAfter, QueryDocumentSnapshot, DocumentData, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types/user';
import { FollowButton } from '../components/profile/FollowButton';
import { UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/user';

const USERS_PER_PAGE = 12;

const DiscoverUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchUsers = async (lastDoc?: QueryDocumentSnapshot<DocumentData>) => {
    if (!user) {
      setError('You must be logged in to view users');
      setLoading(false);
      return;
    }

    try {
      // Create a base query that:
      // 1. Only shows public profiles
      // 2. Orders by username for consistent pagination
      let baseQuery = query(
        collection(db, 'users'),
        where('settings.isPrivate', '==', false),
        orderBy('username'),
        limit(USERS_PER_PAGE)
      );

      if (lastDoc) {
        baseQuery = query(
          collection(db, 'users'),
          where('settings.isPrivate', '==', false),
          orderBy('username'),
          startAfter(lastDoc),
          limit(USERS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(baseQuery);
      
      if (querySnapshot.empty) {
        console.log('No users found in query');
        setHasMore(false);
        if (!lastDoc) {
          setUsers([]);
        }
        setLoading(false);
        return;
      }

      console.log(`Found ${querySnapshot.docs.length} users`);
      const newUsers = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('User data:', { uid: doc.id, ...data });
        return {
          ...data,
          uid: doc.id,
        } as UserProfile;
      }).filter(u => u.uid !== user.uid); // Filter out the current user

      console.log(`After filtering current user, ${newUsers.length} users remain`);

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
      setHasMore(querySnapshot.docs.length === USERS_PER_PAGE);

      if (lastDoc) {
        setUsers(prev => [...prev, ...newUsers]);
      } else {
        setUsers(newUsers);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]); // Add user to dependency array

  const loadMore = () => {
    if (lastVisible) {
      fetchUsers(lastVisible);
    }
  };

  const createTestUser = async () => {
    if (!user) return;
    try {
      const testUid = `test_${Date.now()}`;
      await userService.createTestUser(testUid);
      // Refresh the users list
      fetchUsers();
    } catch (err) {
      console.error('Error creating test user:', err);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchUsers();
              }}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Discover Users</h1>
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={createTestUser}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Test User
              </button>
            )}
          </div>
          
          {users.length === 0 && !loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {users.map((user) => (
                <div
                  key={user.uid}
                  className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
                >
                  <div className="p-4">
                    <Link
                      to={`/app/users/${user.uid}`}
                      className="block group"
                    >
                      <div className="flex items-center space-x-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.username}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">
                            {user.username}
                          </p>
                          {user.bio && (
                            <p className="text-sm text-gray-500 truncate">
                              {user.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                    
                    <div className="mt-4">
                      <FollowButton targetUserId={user.uid} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex justify-center mt-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {!loading && hasMore && users.length > 0 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverUsers; 
import { createBrowserRouter } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import CreateNote from '../pages/CreateNote';
import { TastingNotes } from '../pages/TastingNotes';
import NotePage from '../pages/NotePage';
import EditNote from '../pages/EditNote';
import NotFound from '../pages/NotFound';
import Profile from '../pages/Profile';
import Layout from '../components/Layout';
import DiscoverUsers from '../pages/DiscoverUsers';
import { UserProfileView } from '../components/profile/UserProfileView';
import { MyProfileView } from '../components/profile/MyProfileView';
import { useParams } from 'react-router-dom';
import { SharedWithMeNotes } from '../components/notes/SharedWithMeNotes';
import { BookmarkedNotes } from '../components/notes/BookmarkedNotes';
import ActivityFeedPage from '../pages/ActivityFeed';
import NotificationsPage from '../pages/Notifications';
import FriendsPage from '../pages/FriendsPage';
import FamilyPage from '../pages/FamilyPage';
import FollowersPage from '../pages/FollowersPage';
import FollowingPage from '../pages/FollowingPage';
import UserNotesPage from '../pages/UserNotesPage';
import { Dashboard } from '../pages/Dashboard';
import RestaurantsPage from '../pages/RestaurantsPage';
import RestaurantPage from '../pages/RestaurantPage';

// Wrapper component to pass userId from URL params
const UserProfileViewWrapper = () => {
  const { userId } = useParams<{ userId: string }>();
  return userId ? <UserProfileView userId={userId} /> : null;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginForm />,
  },
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/register',
    element: <RegisterForm />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordForm />,
  },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Dashboard />
      },
      {
        path: 'tasting-notes',
        element: <TastingNotes />
      },
      {
        path: 'shared-with-me',
        element: <SharedWithMeNotes />
      },
      {
        path: 'bookmarks',
        element: <BookmarkedNotes />
      },
      {
        path: 'restaurants',
        element: <RestaurantsPage />
      },
      {
        path: 'restaurants/:restaurantId',
        element: <RestaurantPage />
      },
      {
        path: 'activity',
        element: <ActivityFeedPage />
      },
      {
        path: 'friends',
        element: <FriendsPage />
      },
      {
        path: 'family',
        element: <FamilyPage />
      },
      {
        path: 'discover',
        element: <DiscoverUsers />
      },
      {
        path: 'create-note',
        element: <CreateNote />
      },
      {
        path: 'notes/:id',
        element: <NotePage />
      },
      {
        path: 'notes/:id/edit',
        element: <EditNote />
      },
      {
        path: 'profile/edit',
        element: <Profile />
      },
      {
        path: 'users/me',
        element: <MyProfileView />
      },
      {
        path: 'users/:userId',
        element: <UserProfileViewWrapper />
      },
      {
        path: 'users/:userId/followers',
        element: <FollowersPage />
      },
      {
        path: 'users/:userId/following',
        element: <FollowingPage />
      },
      {
        path: 'users/:userId/family',
        element: <FamilyPage />
      },
      {
        path: 'users/:userId/notes',
        element: <UserNotesPage />
      },
      {
        path: 'notifications',
        element: <NotificationsPage />
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />,
  },
]); 
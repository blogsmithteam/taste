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
        element: <TastingNotes />
      },
      {
        path: 'tasting-notes',
        element: <TastingNotes />
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
        path: 'profile',
        element: <Profile />
      }
    ]
  },
  {
    path: '*',
    element: <NotFound />,
  },
]); 
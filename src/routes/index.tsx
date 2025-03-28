import { createBrowserRouter } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { Dashboard } from '../pages/Dashboard';
import CreateNote from '../pages/CreateNote';
import { TastingNotes } from '../pages/TastingNotes';
import NotePage from '../pages/NotePage';
import EditNote from '../pages/EditNote';
import NotFound from '../pages/NotFound';

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
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/create-note',
    element: (
      <ProtectedRoute>
        <CreateNote />
      </ProtectedRoute>
    ),
  },
  {
    path: '/tasting-notes',
    element: (
      <ProtectedRoute>
        <TastingNotes />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notes/:id',
    element: (
      <ProtectedRoute>
        <NotePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notes/:id/edit',
    element: (
      <ProtectedRoute>
        <EditNote />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
]); 
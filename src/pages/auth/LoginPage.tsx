import { Link } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';

export function LoginPage() {
  return (
    <div>
      <AuthForm mode="login" />
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
} 
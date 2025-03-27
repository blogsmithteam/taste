import { Link } from 'react-router-dom';
import { AuthForm } from '@/components/auth/AuthForm';

export function RegisterPage() {
  return (
    <div>
      <AuthForm mode="register" />
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
} 
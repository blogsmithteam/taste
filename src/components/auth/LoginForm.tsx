import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FormInput } from './shared/FormInput';
import { Button } from './shared/Button';

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
      setSuccessMessage('Login successful!');
      // Get the redirect path from location state or default to dashboard
      const from = (location.state as any)?.from?.pathname || '/app';
      // Wait a moment to show the success message before redirecting
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1500);
    } catch (error) {
      setSubmitError((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-taste-light flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-4xl font-serif font-bold text-center text-taste-primary mb-6">
          Welcome Back
        </h1>
        <p className="text-center text-gray-700 text-lg">
          Sign in to continue your culinary journey
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg sm:px-10 border border-taste-primary/10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {submitError && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {submitError}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      {successMessage}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <FormInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="Email address"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/reset-password"
                  className="font-medium text-taste-primary hover:text-taste-primary/80"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <FormInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              label="Password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign in
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-medium text-taste-primary hover:text-taste-primary/80"
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
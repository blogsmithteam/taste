import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      setAuthState({
        user,
        loading: false,
      });
    });

    return () => unsubscribe();
  }, []);

  return authState;
}; 
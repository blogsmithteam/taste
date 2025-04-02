import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User, sendPasswordResetEmail, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { userService } from '../services/user';
import { ProfileFormData } from '../types/user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error('Error signing in:', err);
      setError('Failed to sign in');
      throw err;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setError(null);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await userService.createUserProfile(user.uid, email, username);
    } catch (err) {
      console.error('Error signing up:', err);
      setError('Failed to create account');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Failed to sign out');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError('Failed to reset password');
      throw err;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      if (!user) {
        throw new Error('No user logged in');
      }
      
      // Update Firebase Auth profile if displayName or photoURL are provided
      if (data.displayName || data.photoURL) {
        await firebaseUpdateProfile(user, {
          displayName: data.displayName || user.displayName,
          photoURL: data.photoURL || user.photoURL
        });
      }
      
      // Convert Firebase User data to our ProfileFormData type for Firestore update
      // Only include fields that are relevant to our ProfileFormData
      const profileData: Partial<ProfileFormData> = {};
      
      // Only add fields that are actually present in the data object
      if (data.displayName) {
        profileData.username = data.displayName;
      }
      
      if (data.email) {
        profileData.email = data.email;
      }
      
      // Only update Firestore if we have data to update
      if (Object.keys(profileData).length > 0) {
        await userService.updateUserProfile(user.uid, profileData);
      }
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
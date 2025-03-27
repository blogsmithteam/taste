import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

// Mock the auth service
vi.mock('../services/auth', () => ({
  authService: {
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

// Mock Firebase auth
vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide auth context to children', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.signIn).toBe('function');
    expect(typeof result.current.signUp).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.resetPassword).toBe('function');
    expect(typeof result.current.updateProfile).toBe('function');
  });

  it('should handle successful sign in', async () => {
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    };

    (authService.signIn as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      await result.current.signIn('test@example.com', 'password');
    });

    expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password');
  });

  it('should handle sign in error', async () => {
    const error = new Error('Invalid credentials');
    (authService.signIn as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrong-password');
      } catch (e) {
        // Expected error
      }
    });

    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should handle successful sign up', async () => {
    const mockUser = {
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    };

    (authService.signUp as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      await result.current.signUp('test@example.com', 'password', 'Test User');
    });

    expect(authService.signUp).toHaveBeenCalledWith('test@example.com', 'password', 'Test User');
  });

  it('should handle successful sign out', async () => {
    (authService.signOut as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(authService.signOut).toHaveBeenCalled();
  });

  it('should handle password reset', async () => {
    (authService.resetPassword as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      await result.current.resetPassword('test@example.com');
    });

    expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com');
  });

  it('should handle profile update', async () => {
    const updateData = {
      displayName: 'New Name',
      photoURL: 'https://example.com/photo.jpg',
    };

    (authService.updateProfile as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await act(async () => {
      await result.current.updateProfile(updateData);
    });

    expect(authService.updateProfile).toHaveBeenCalledWith(updateData);
  });
}); 
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { login as apiLogin, logout as apiLogout, validateToken } from '../services/api';
import { User } from '../types';

// Extend User type to include token
interface AuthUser extends User {
  token: string;
  force_password_change?: boolean;
}

// Define the context type
interface AuthContextType {
  user: AuthUser | null;
  setAuthUser: (user: User & { token: string }) => void;
  updateUser: (user: AuthUser) => void;
  isAuthenticated: () => boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // PERMANENT FIX: Initialize user from localStorage on mount
  useEffect(() => {
    const initializeFromStorage = async () => {
      console.log('AUTH: Initializing from localStorage');
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Parse the stored user data
          const parsedUser = JSON.parse(storedUser);

          // Create a complete user object
          const userData: AuthUser = {
            id: parsedUser.id,
            email: parsedUser.email,
            name: parsedUser.name || parsedUser.email.split('@')[0],
            role: parsedUser.role || 'user',
            token: storedToken
          };

          // Update the user state
          setUser(userData);
          console.log('AUTH: Successfully initialized from localStorage');

          // Validate the token in the background
          try {
            const isValid = await validateToken();
            if (!isValid && mountedRef.current) {
              console.log('AUTH: Token validation failed, clearing user session');
              setUser(null);
              localStorage.removeItem('token');
              localStorage.removeItem('user');
            }
          } catch (validationError) {
            console.warn('AUTH: Token validation error:', validationError);
            // Don't clear the user session on validation error
            // This allows the app to work offline or when the API is unavailable
          }
        } catch (error) {
          console.error('AUTH: Error parsing stored user:', error);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } else {
        console.log('AUTH: No stored credentials found');
      }

      // Always set loading to false after initialization
      if (mountedRef.current) {
        setIsLoading(false);
      }
    };

    // Initialize immediately
    initializeFromStorage();

    // Also set a backup timeout to ensure loading state is cleared
    const timer = setTimeout(() => {
      if (isLoading && mountedRef.current) {
        console.log('AUTH: Force setting isLoading to false after timeout');
        setIsLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize auth state from local storage and validate token
  useEffect(() => {
    // Define an async function inside the effect to allow for await
    const validateAndLoadUser = async () => {
      console.log('AUTH: Starting validateAndLoadUser');
      // We don't need to set isLoading here since it's already set to true by default
      // and we have the initializeFromStorage function that handles this

      // This function is now just a backup validation
      // The main initialization is done by initializeFromStorage

      // We'll just check if we need to validate the token
      const storedToken = localStorage.getItem('token');

      if (storedToken) {
        try {
          console.log('AUTH: Found stored token, validating in background...');
          // Check with the server if token is still valid, but don't block the UI
          validateToken().catch(error => {
            console.warn('AUTH: Background token validation error:', error);
            // Don't clear the token on validation error
            // This allows the app to work offline or when the API is unavailable
          });
        } catch (error) {
          console.error('AUTH: Error in background token validation:', error);
        }
      }

      // We don't need to set isLoading to false here since it's handled by initializeFromStorage
    };

    validateAndLoadUser();
  }, []);

  // Login function - fixed to handle component unmounting properly
  const login = useCallback(async (email: string, password: string) => {
    console.log('AUTH: Login function called with email:', email);
    // Remove the early return if component is unmounted - this causes issues with StrictMode
    // and prevents login from completing

    // Set loading state
    setIsLoading(true);

    try {
      console.log('AUTH: Calling apiLogin...');
      const response = await apiLogin(email, password);
      console.log('AUTH: Login API response received');

      // Create a complete user object with all required fields
      const userData: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || response.user.email.split('@')[0],
        role: response.user.role || 'user', // Default to 'user' if role is missing
        token: response.access_token,
        force_password_change: response.user.force_password_change || false
      };

      // Store in localStorage first for persistence (this will work even if component unmounts)
      localStorage.setItem('token', response.access_token);

      // Store a complete user object in localStorage
      const storageUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || response.user.email.split('@')[0],
        role: response.user.role || 'user'
      };
      localStorage.setItem('user', JSON.stringify(storageUser));
      console.log('AUTH: User data stored in localStorage');

      // Only update state if component is still mounted
      if (mountedRef.current) {
        // Store in state
        setUser(userData);
        console.log('AUTH: User state updated');
      } else {
        console.log('AUTH: Component unmounted, skipping state update but localStorage is set');
      }

      console.log('AUTH: User successfully logged in');

      // Return the user data so the login component can use it if needed
      return userData;

    } catch (error) {
      console.error('AUTH: Login error:', error);
      // Clean up localStorage on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only update state if component is still mounted
      if (mountedRef.current) {
        setUser(null);
      }

      throw error; // Re-throw to allow the login component to handle the error
    } finally {
      // Only update loading state if component is still mounted
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    if (!mountedRef.current) return;

    // Use API logout if available
    apiLogout();

    // Clear state
    setUser(null);
    console.log('Auth: User logged out');
  }, []);

  // Function to update the user data
  const updateUser = useCallback((newUser: AuthUser) => {
    if (!mountedRef.current) return;
    setUser(newUser);
    console.log('Auth: User data updated');
  }, []);

  // Function to check if user is authenticated
  const checkAuthenticated = useCallback(() => {
    const isAuth = !!user && !!user.token;
    return isAuth;
  }, [user]);

  // Public function to set the auth user
  const setAuthUser = useCallback((newUser: User & { token: string }) => {
    updateUser(newUser as AuthUser);
  }, [updateUser]);

  // Context value
  const value = useMemo(() => ({
    user,
    setAuthUser,
    updateUser,
    isAuthenticated: checkAuthenticated,
    isLoading,
    login,
    logout
  }), [user, checkAuthenticated, isLoading, setAuthUser, updateUser, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
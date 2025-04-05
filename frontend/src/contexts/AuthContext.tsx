import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { User } from '../types';
import { login as apiLogin, logout as apiLogout } from '../services/api';

// Extend User type to include token
interface AuthUser extends User {
  token: string;
}

// Define the context type
interface AuthContextType {
  user: AuthUser | null;
  setAuthUser: (user: User & { token: string }) => void;
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize auth state from local storage
  useEffect(() => {
    // Check for existing auth on component mount
    const checkAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({ ...parsedUser, token: storedToken });
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    if (!mountedRef.current) return;
    setIsLoading(true);

    try {
      const response = await apiLogin(email, password);
      
      if (!mountedRef.current) return;
      
      const userData: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name || response.user.email.split('@')[0],
        role: response.user.role,
        token: response.access_token
      };
      
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
    } catch (error) {
      if (mountedRef.current) {
        console.error('Login error:', error);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } finally {
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
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    window.location.href = '/login';
  }, []);

  // Function to update the user data
  const updateUser = useCallback((newUser: AuthUser) => {
    if (!mountedRef.current) return;
    setUser(newUser);
    // Also update localStorage
    localStorage.setItem('token', newUser.token);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  // Function to clear the user data
  const clearUser = useCallback(() => {
    if (!mountedRef.current) return;
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Function to check if user is authenticated
  const checkAuthenticated = useCallback(() => {
    return !!user && !!user.token;
  }, [user]);

  // Public function to set the auth user
  const setAuthUser = useCallback((newUser: User & { token: string }) => {
    updateUser(newUser as AuthUser);
  }, [updateUser]);

  // Context value
  const value = useMemo(() => ({
    user,
    setAuthUser,
    isAuthenticated: checkAuthenticated,
    isLoading,
    login,
    logout
  }), [user, checkAuthenticated, isLoading, setAuthUser, login, logout]);

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
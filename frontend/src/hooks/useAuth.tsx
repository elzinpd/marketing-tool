import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Using the same API_URL defined in useApi.tsx
const API_URL = 'http://localhost:8000/api/v1';

interface User {
  id: number;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  getRedirectPath: () => string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateToken = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found in localStorage');
        throw new Error('No token found');
      }
      
      console.log('Validating token...');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      });
      
      console.log('Token validation successful:', response.data);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('validateToken error:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      console.log(`Attempting login for user: ${email}`);
      const formData = new FormData();
      formData.append('username', email);
      formData.append('password', password);
      
      const response = await axios.post(`${API_URL}/auth/token`, formData);
      
      if (response.data && response.data.access_token) {
        console.log('Login successful, token received');
        localStorage.setItem('token', response.data.access_token);
        
        // Set user data if it's included in the response
        if (response.data.user) {
          console.log('User data included in response:', response.data.user);
          setUser(response.data.user);
        } else {
          // Fetch user data if not included in login response
          console.log('Fetching user data...');
          const userResponse = await axios.get(`${API_URL}/auth/me`, {
            headers: { 
              Authorization: `Bearer ${response.data.access_token}` 
            }
          });
          console.log('User data fetched:', userResponse.data);
          setUser(userResponse.data);
        }
        
        setIsAuthenticated(true);
        
        // Redirect based on user role
        const redirectPath = getRedirectPath();
        console.log(`Redirecting to ${redirectPath} based on user role`);
        navigate(redirectPath);
      } else {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (err.response) {
        console.error('Login API error: Status', err.response.status, 'Response:', err.response.data);
        errorMessage = `Login failed: ${err.response.status} ${err.response.statusText}`;
        if (err.response.data && err.response.data.detail) {
          errorMessage = err.response.data.detail;
        }
      } else if (err.request) {
        console.error('Login error: No response received', err.request);
        errorMessage = 'Login failed: No response from server';
      } else {
        console.error('Login error:', err.message);
        errorMessage = `Login failed: ${err.message}`;
      }
      
      setAuthError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  }, [navigate]);

  const clearError = () => {
    setAuthError(null);
  };

  // Determine redirect path based on user role
  const getRedirectPath = useCallback(() => {
    if (!user) {
      console.log('No user data, redirecting to default dashboard');
      return '/dashboard';
    }
    
    console.log(`Determining redirect path for role: ${user.role}`);
    if (user.role === 'admin' || user.role === 'superadmin') {
      console.log('Admin user detected, can access admin panel');
      return '/dashboard'; // Admin users still go to dashboard first but can access admin panel
    } else {
      console.log('Regular user detected, redirecting to dashboard');
      return '/dashboard';
    }
  }, [user]);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    login,
    logout,
    clearError,
    getRedirectPath
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const PrivateRoute = ({ children, adminOnly = false }: PrivateRouteProps) => {
  console.log('PrivateRoute component loaded', { adminOnly });
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated()) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if admin access is required and user is not an admin
  if (adminOnly && user?.role !== 'admin') {
    console.log('Admin access required but user is not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  console.log('Authentication successful, rendering children');
  return <>{children}</>;
};

export default PrivateRoute;
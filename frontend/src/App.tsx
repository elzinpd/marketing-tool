import { Box, Button, CircularProgress, CssBaseline, Paper, ThemeProvider, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation, useNavigate } from 'react-router-dom';
import ChangePassword from './components/ChangePassword';
import Navbar from './components/Navbar';
import PasswordReset from './components/PasswordReset';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboards from './pages/ClientDashboards';
import ClientManagement from './pages/ClientManagement';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import SystemSettings from './pages/SystemSettings';
import TestPage from './pages/TestPage';
import UserManagement from './pages/UserManagement';
import theme from './theme';

// Add a proper 404 Page component
const NotFoundPage = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="90vh"
    >
      <Paper elevation={3} sx={{ p: 5, maxWidth: 500, textAlign: 'center' }}>
        <Typography variant="h3" color="primary" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          The page you are looking for doesn't exist or has been moved.
        </Typography>
        <Button
          component={Link}
          to="/"
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Go to Home
        </Button>
      </Paper>
    </Box>
  );
};

// Enhanced version of ProtectedRoute with permanent fixes
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we have a token and user in localStorage
  const hasToken = !!localStorage.getItem('token');
  const hasUser = !!localStorage.getItem('user');

  // Log the auth state for debugging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ROUTE: Protected route state:', {
        isAuthenticated: isAuthenticated(),
        userRole: user?.role,
        isLoading,
        adminOnly,
        path: location.pathname,
        hasToken,
        hasUser
      });
    }
  }, [isAuthenticated, user, isLoading, adminOnly, location.pathname, hasToken, hasUser]);

  // PERMANENT FIX: If auth context says not authenticated but we have token/user in localStorage,
  // use the localStorage data instead
  if (!isAuthenticated() && hasToken && hasUser) {
    // Only check admin status for admin routes
    if (adminOnly) {
      try {
        const userObj = JSON.parse(localStorage.getItem('user') || '{}');
        if (userObj.role !== 'admin') {
          return <Navigate to="/dashboard" replace />;
        }
      } catch (e) {
        console.error('Error parsing user object:', e);
      }
    }

    // Allow access to the route
    return <>{children}</>;
  }

  // Show loading state (but only briefly)
  if (isLoading) {
    // Set a timeout to show a helpful message if loading takes too long
    setTimeout(() => {
      const loadingElement = document.querySelector('.loading-indicator');
      if (loadingElement) {
        loadingElement.innerHTML = 'Loading taking longer than expected...';
      }
    }, 3000);

    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column" className="loading-indicator">
        <CircularProgress />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  // Normal auth check
  if (!isAuthenticated()) {
    // Store the current path to redirect back after login
    sessionStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Check admin status for admin routes
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user needs to change password
  if (user?.force_password_change && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // User is authenticated and has proper role, render children
  return <>{children}</>;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [loadingTooLong, setLoadingTooLong] = useState(false);

  // Log authentication state in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('APP: Authentication state:', {
        isAuthenticated: isAuthenticated(),
        isLoading,
        hasLocalToken: !!localStorage.getItem('token')
      });
    }
  }, [isAuthenticated, isLoading]);

  // Set loadingTooLong to true after a timeout
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setLoadingTooLong(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Check if we have authentication data in localStorage
  const hasToken = !!localStorage.getItem('token');
  const hasUser = !!localStorage.getItem('user');

  // Show loading state during initial auth check, but only if we haven't been loading too long
  if (isLoading && !loadingTooLong) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column">
        <CircularProgress />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Loading application...
        </Typography>
      </Box>
    );
  }

  // If loading is taking too long but we have auth data, continue anyway
  if (loadingTooLong && hasToken && hasUser) {
    // Continue to the app content
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isAuthenticated() && <Navbar />}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
        <Routes>
          {/* Login route - redirect to dashboard if already logged in */}
          <Route
            path="/login"
            element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />}
          />

          {/* Password reset route */}
          <Route
            path="/reset-password"
            element={<PasswordReset />}
          />

          {/* Change password route */}
          <Route
            path="/change-password"
            element={
              <PrivateRoute>
                <ChangePassword />
              </PrivateRoute>
            }
          />

          {/* Protected dashboard route */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Protected admin dashboard route */}
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <AdminDashboard />
              </PrivateRoute>
            }
          />

          {/* Protected user management route */}
          <Route
            path="/users"
            element={
              <PrivateRoute adminOnly>
                <UserManagement />
              </PrivateRoute>
            }
          />

          {/* Protected client management route */}
          <Route
            path="/clients"
            element={
              <PrivateRoute adminOnly>
                <ClientManagement />
              </PrivateRoute>
            }
          />

          {/* Protected client dashboards route */}
          <Route
            path="/client-dashboards"
            element={
              <PrivateRoute>
                <ClientDashboards />
              </PrivateRoute>
            }
          />

          {/* Protected system settings route */}
          <Route
            path="/system-settings"
            element={
              <PrivateRoute>
                <SystemSettings />
              </PrivateRoute>
            }
          />

          {/* Default route redirects to dashboard if authenticated, otherwise to login */}
          <Route
            path="/"
            element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
          />

          {/* Test page route */}
          <Route
            path="/test"
            element={<TestPage />}
          />

          {/* 404 route handling */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Box>
    </Box>
  );
};

const App = () => {
  // Log when App component initializes
  console.log('App component initializing');

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
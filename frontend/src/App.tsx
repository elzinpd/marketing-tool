import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress, Button, Typography, Paper } from '@mui/material';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import theme from './theme';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import ClientManagement from './pages/ClientManagement';
import ClientDashboards from './pages/ClientDashboards';
import SystemSettings from './pages/SystemSettings';
import Navbar from './components/Navbar';

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

// Enhanced version of ProtectedRoute for better debugging
const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Log the auth state for debugging
  console.log('Protected route state:', { 
    isAuthenticated, 
    userRole: user?.role, 
    isLoading,
    adminOnly,
    hasToken: !!localStorage.getItem('token')
  });

  // Show loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Check auth status
  if (!isAuthenticated) {
    console.log("Protected route: Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Check admin status for admin routes
  if (adminOnly && user?.role !== 'admin') {
    console.log("Protected route: Not admin, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and has proper role, render children
  return <>{children}</>;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Debug authentication state on each render
  console.log('App authentication state:', { 
    isAuthenticated: isAuthenticated(), 
    isLoading, 
    hasLocalToken: !!localStorage.getItem('token') 
  });

  // Show loading state during initial auth check
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
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
          
          {/* Protected dashboard route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Protected admin dashboard route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Protected user management route */}
          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Protected client management route */}
          <Route
            path="/clients"
            element={
              <ProtectedRoute adminOnly>
                <ClientManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Protected client dashboards route */}
          <Route
            path="/client-dashboards"
            element={
              <ProtectedRoute>
                <ClientDashboards />
              </ProtectedRoute>
            }
          />
          
          {/* Protected system settings route */}
          <Route
            path="/system-settings"
            element={
              <ProtectedRoute>
                <SystemSettings />
              </ProtectedRoute>
            }
          />
          
          {/* Default route redirects to dashboard if authenticated, otherwise to login */}
          <Route 
            path="/" 
            element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} 
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
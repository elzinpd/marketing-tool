import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Paper,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login page: Attempting to login with:', email);
      await login(email, password);

      // Check if we have a token in localStorage after login
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Login page: Login successful, token stored in localStorage');

        // Get redirect path from session storage or default to dashboard
        const redirectPath = sessionStorage.getItem('redirectPath') || '/dashboard';
        console.log('Login page: Redirecting to:', redirectPath);

        // Clear the redirect path
        sessionStorage.removeItem('redirectPath');

        // Navigate to the redirect path
        navigate(redirectPath);
      } else {
        console.log('Login page: Login failed, no token in localStorage');
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Login page: Login error:', err);
      let errorMessage = 'Invalid email or password. Please try again.';

      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <img
            src={logo}
            alt="Company Logo"
            style={{
              height: '60px',
              marginBottom: '16px',
              objectFit: 'contain'
            }}
          />
          <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold' }}>
            Marketing Tool
          </Typography>
        </Box>

        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
            Sign in
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Box sx={{ width: '100%', textAlign: 'right' }}>
              <Button
                variant="text"
                color="primary"
                onClick={() => navigate('/reset-password')}
                sx={{ textTransform: 'none' }}
              >
                Forgot password?
              </Button>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Marketing Tool | All Rights Reserved
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Login;
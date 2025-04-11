import {
    Alert,
    Box,
    Button,
    Container,
    Paper,
    Snackbar,
    TextField,
    Typography
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface ChangePasswordProps {
  isFirstLogin?: boolean;
  onComplete?: () => void;
  onLoad?: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ isFirstLogin = false, onComplete, onLoad }) => {
  console.log('ChangePassword component loaded');

  // Call onLoad prop when component mounts
  React.useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setNotification({
        open: true,
        message: 'Passwords do not match',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });

      setNotification({
        open: true,
        message: response.data.message,
        severity: 'success'
      });

      // Update user in context to remove force_password_change flag
      if (user) {
        updateUser({
          ...user,
          force_password_change: false
        });
      }

      // If this is a first login, call the onComplete callback
      if (isFirstLogin && onComplete) {
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        // Otherwise, redirect to dashboard
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (error: any) {
      setNotification({
        open: true,
        message: error.response?.data?.detail || 'Error changing password',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          {isFirstLogin ? 'Set New Password' : 'Change Password'}
        </Typography>

        {isFirstLogin && (
          <Typography variant="body1" color="primary" gutterBottom>
            You need to set a new password before continuing.
          </Typography>
        )}

        <Box component="form" onSubmit={handleChangePassword} sx={{ mt: 2 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="currentPassword"
            label="Current Password"
            type="password"
            id="currentPassword"
            autoFocus
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="newPassword"
            label="New Password"
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            {isFirstLogin ? 'Set Password' : 'Change Password'}
          </Button>

          {!isFirstLogin && (
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          )}
        </Box>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ChangePassword;

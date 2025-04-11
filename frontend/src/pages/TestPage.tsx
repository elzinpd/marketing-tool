import { Box, Button, Container, Paper, Typography } from '@mui/material';
import React from 'react';
import { Link } from 'react-router-dom';
import ChangePassword from '../components/ChangePassword';
import PasswordReset from '../components/PasswordReset';

const TestPage: React.FC = () => {
  console.log('TestPage component loaded');

  // Add a state to track if components are loaded
  const [componentsLoaded, setComponentsLoaded] = React.useState({
    passwordReset: false,
    changePassword: false
  });

  // Function to mark a component as loaded
  const markComponentLoaded = (component: 'passwordReset' | 'changePassword') => {
    setComponentsLoaded(prev => ({
      ...prev,
      [component]: true
    }));
  };

  // Effect to log when components are loaded
  React.useEffect(() => {
    console.log('Components loaded status:', componentsLoaded);
  }, [componentsLoaded]);

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Component Test Page
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Password Reset Component {componentsLoaded.passwordReset ? '✅' : '❌'}
          </Typography>
          <Box sx={{ border: '1px solid #ccc', p: 2, borderRadius: 1 }}>
            {React.createElement(PasswordReset, {
              onLoad: () => markComponentLoaded('passwordReset')
            })}
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Change Password Component {componentsLoaded.changePassword ? '✅' : '❌'}
          </Typography>
          <Box sx={{ border: '1px solid #ccc', p: 2, borderRadius: 1 }}>
            {React.createElement(ChangePassword, {
              onLoad: () => markComponentLoaded('changePassword')
            })}
          </Box>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Button component={Link} to="/" variant="contained" color="primary">
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default TestPage;

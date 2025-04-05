import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button 
} from '@mui/material';
import { 
  People as UsersIcon, 
  BusinessCenter as ClientsIcon, 
  Assessment as ReportsIcon, 
  Settings as SettingsIcon 
} from '@mui/icons-material';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  const adminModules = [
    {
      title: 'User Management',
      description: 'Create, update, and manage user accounts and permissions',
      icon: <UsersIcon fontSize="large" color="primary" />,
      action: () => navigate('/users')
    },
    {
      title: 'Client Management',
      description: 'Manage clients and their campaign keyword settings',
      icon: <ClientsIcon fontSize="large" color="primary" />,
      action: () => navigate('/clients')
    },
    {
      title: 'Report Templates',
      description: 'Create and manage report templates',
      icon: <ReportsIcon fontSize="large" color="primary" />,
      action: () => console.log('Report templates not implemented yet')
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and integrations',
      icon: <SettingsIcon fontSize="large" color="primary" />,
      action: () => navigate('/system-settings')
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Marketing Tool Administration
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage users, clients, and system settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {adminModules.map((module, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Box py={2}>{module.icon}</Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {module.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {module.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  fullWidth 
                  variant="contained" 
                  onClick={module.action}
                >
                  Access
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 
import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Menu, 
  MenuItem, 
  IconButton, 
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  BusinessCenter as ClientIcon,
  People as UsersIcon,
  Assessment as DashboardsIcon,
  Settings as SettingsIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const isAdmin = user?.role === 'admin';
  const isAdminPage = location.pathname === '/admin';
  const isClientsPage = location.pathname === '/clients';
  const isUsersPage = location.pathname === '/users';
  const isClientDashboardsPage = location.pathname === '/client-dashboards';
  const isSystemSettingsPage = location.pathname === '/system-settings';

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMenuItemClick = (path: string) => {
    navigate(path);
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box display="flex" alignItems="center" flexGrow={1}>
          <img 
            src={logo} 
            alt="Marketing Tool Logo" 
            style={{ 
              height: '40px',
              width: 'auto',
              marginRight: '16px',
              cursor: 'pointer',
              objectFit: 'contain'
            }}
            onClick={() => navigate('/')}
          />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            {isAdminPage ? (
              <>
                <AdminIcon fontSize="small" />
                Admin Dashboard
              </>
            ) : isClientsPage ? (
              <>
                <ClientIcon fontSize="small" />
                Client Management
              </>
            ) : isUsersPage ? (
              <>
                <UsersIcon fontSize="small" />
                User Management
              </>
            ) : isClientDashboardsPage ? (
              <>
                <DashboardsIcon fontSize="small" />
                Client Dashboards
              </>
            ) : isSystemSettingsPage ? (
              <>
                <SettingsIcon fontSize="small" />
                System Settings
              </>
            ) : (
              <>Marketing Tool</>
            )}
            
            {isAdmin && !isAdminPage && !isClientsPage && !isUsersPage && !isClientDashboardsPage && !isSystemSettingsPage && (
              <Chip 
                label="Admin" 
                size="small" 
                color="secondary"
                sx={{ ml: 1, height: 20 }}
              />
            )}
          </Typography>
        </Box>

        {isAuthenticated() && (
          <Box display="flex" alignItems="center">
            <Button 
              color="inherit" 
              sx={{ mr: 2 }}
              endIcon={<KeyboardArrowDownIcon />}
              onClick={handleMenuOpen}
            >
              {isAdmin ? 'Admin Menu' : 'Menu'}
            </Button>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => handleMenuItemClick('/dashboard')}>
                <DashboardIcon fontSize="small" sx={{ mr: 1 }} />
                Dashboard
              </MenuItem>
              
              <MenuItem onClick={() => handleMenuItemClick('/client-dashboards')}>
                <DashboardsIcon fontSize="small" sx={{ mr: 1 }} />
                Client Dashboards
              </MenuItem>
              
              {isAdmin && (
                <>
                  <MenuItem onClick={() => handleMenuItemClick('/admin')}>
                    <AdminIcon fontSize="small" sx={{ mr: 1 }} />
                    Admin Dashboard
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuItemClick('/users')}>
                    <UsersIcon fontSize="small" sx={{ mr: 1 }} />
                    User Management
                  </MenuItem>
                  <MenuItem onClick={() => handleMenuItemClick('/clients')}>
                    <ClientIcon fontSize="small" sx={{ mr: 1 }} />
                    Client Management
                  </MenuItem>
                </>
              )}
              
              <MenuItem onClick={() => handleMenuItemClick('/system-settings')}>
                <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
                System Settings
              </MenuItem>
              
              <Divider />
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>

            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                border: `1px solid ${theme.palette.primary.contrastText}`,
                borderRadius: '4px',
                padding: '4px 8px',
                opacity: 0.8
              }}
            >
              <PersonIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
              <Typography variant="body2" component="span">
                {user?.email}
              </Typography>
            </Box>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  Container,
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LockReset as ResetPasswordIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon
} from '@mui/icons-material';

// Type definitions
interface User {
  id: number;
  email: string;
  role: string;
  clients: Array<{id: number, name: string}>;
  is_active: boolean;
}

interface Client {
  id: number;
  name: string;
}

interface UserFormData {
  email: string;
  password: string;
  role: string;
  clients: number[];
}

const UserManagement: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [userForm, setUserForm] = useState<UserFormData>({
    email: '',
    password: '',
    role: 'client_manager',
    clients: []
  });

  // Redirect non-admin users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersResponse, clientsResponse] = await Promise.all([
        api.get('/users'),
        api.get('/clients')
      ]);

      setUsers(usersResponse.data);
      setClients(clientsResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setNotification({
        open: true,
        message: 'Failed to load data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle form change
  const handleFormChange = (field: keyof UserFormData, value: any) => {
    setUserForm(prev => ({ ...prev, [field]: value }));
  };

  // Get client name by ID
  const getClientNameById = (clientId: number): string => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };

  // Open user form for editing
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      email: user.email,
      password: '', // Empty for updates
      role: user.role,
      clients: user.clients.map(client => client.id) || []
    });
    setUserFormOpen(true);
  };

  // Open user form for creating
  const handleAddUser = () => {
    setSelectedUser(null);
    setUserForm({
      email: '',
      password: '',
      role: 'client_manager',
      clients: []
    });
    setUserFormOpen(true);
  };

  // Handle form submission
  const handleSubmitUser = async () => {
    try {
      if (selectedUser) {
        // Update existing user
        await api.put(`/users/${selectedUser.id}`, userForm);
        
        setNotification({
          open: true,
          message: 'User updated successfully',
          severity: 'success'
        });
      } else {
        // Create new user
        await api.post('/users', userForm);
        
        setNotification({
          open: true,
          message: 'User created successfully',
          severity: 'success'
        });
      }
      
      setUserFormOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setNotification({
        open: true,
        message: error.response?.data?.detail || 'Failed to save user',
        severity: 'error'
      });
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Confirm user deletion
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await api.delete(`/users/${userToDelete.id}`);
      
      setNotification({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
      
      setDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error deleting user:', error);
      setNotification({
        open: true,
        message: 'Failed to delete user',
        severity: 'error'
      });
    }
  };

  // Open reset password dialog
  const handleResetPassword = (user: User) => {
    setResetPasswordUser(user);
    setNewPassword('');
    setResetPasswordDialogOpen(true);
  };

  // Confirm password reset
  const handleConfirmResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    
    try {
      await api.put(
        `/users/${resetPasswordUser.id}`,
        {
          email: resetPasswordUser.email,
          role: resetPasswordUser.role,
          password: newPassword,
          clients: resetPasswordUser.clients.map(client => client.id)
        }
      );
      
      setNotification({
        open: true,
        message: 'Password reset successfully',
        severity: 'success'
      });
      
      setResetPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error resetting password:', error);
      setNotification({
        open: true,
        message: 'Failed to reset password',
        severity: 'error'
      });
    }
  };

  // Get role display chip
  const getRoleChip = (role: string) => {
    switch (role) {
      case 'admin':
        return <Chip label="Super Admin" color="error" size="small" />;
      case 'agency_head':
        return <Chip label="Agency Head" color="warning" size="small" />;
      case 'client_manager':
        return <Chip label="Client Manager" color="primary" size="small" />;
      default:
        return <Chip label={role} color="default" size="small" />;
    }
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  if (isLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            color="primary" 
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">User Management</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddUser}
        >
          Add New User
        </Button>
      </Box>

      <Paper sx={{ p: 2, overflow: 'auto' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="5%">ID</TableCell>
                <TableCell width="25%">Email</TableCell>
                <TableCell width="15%">Role</TableCell>
                <TableCell width="30%">Assigned Clients</TableCell>
                <TableCell width="15%">Status</TableCell>
                <TableCell width="10%">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleChip(user.role)}</TableCell>
                  <TableCell>
                    {user.clients && user.clients.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.clients.map(client => (
                          <Chip 
                            key={client.id}
                            label={client.name} 
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No clients assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Chip label="Active" color="success" size="small" />
                    ) : (
                      <Chip label="Inactive" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Edit User">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditUser(user)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Reset Password">
                        <IconButton 
                          size="small" 
                          color="warning"
                          onClick={() => handleResetPassword(user)}
                        >
                          <ResetPasswordIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete User">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(user)}
                          disabled={user.id === (Number(localStorage.getItem('userId')) || 0)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Form Dialog */}
      <Dialog open={userFormOpen} onClose={() => setUserFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                required
                value={userForm.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Password"
                type="password"
                fullWidth
                required={!selectedUser}
                value={userForm.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                helperText={selectedUser ? "Leave blank to keep current password" : "Required for new users"}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userForm.role}
                  label="Role"
                  onChange={(e) => handleFormChange('role', e.target.value)}
                >
                  <MenuItem value="admin">Super Admin</MenuItem>
                  <MenuItem value="agency_head">Agency Head</MenuItem>
                  <MenuItem value="client_manager">Client Manager</MenuItem>
                </Select>
                <FormHelperText>
                  {userForm.role === 'admin' && "Full access to all features and settings"}
                  {userForm.role === 'agency_head' && "Can view all clients but cannot change system settings"}
                  {userForm.role === 'client_manager' && "Can only manage assigned clients"}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Assigned Clients</InputLabel>
                <Select
                  multiple
                  value={userForm.clients}
                  label="Assigned Clients"
                  onChange={(e) => handleFormChange('clients', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).map((clientId) => (
                        <Chip 
                          key={clientId} 
                          label={getClientNameById(clientId)} 
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {userForm.role === 'client_manager' 
                    ? "Select clients this user can manage" 
                    : "Agency heads and admins can see all clients, but you can still assign specific ones"}
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserFormOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmitUser} 
            variant="contained" 
            color="primary"
            disabled={!userForm.email || (!userForm.password && !selectedUser)}
          >
            {selectedUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the user <strong>{userToDelete?.email}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onClose={() => setResetPasswordDialogOpen(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Reset password for <strong>{resetPasswordUser?.email}</strong>
          </Typography>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPasswordDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmResetPassword} 
            color="primary" 
            variant="contained"
            disabled={!newPassword}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserManagement; 
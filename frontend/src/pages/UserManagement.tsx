import {
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    LockReset as ResetPasswordIcon
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormHelperText,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

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
    if (!isLoading && isAuthenticated() && user?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Fallback data for when API requests fail
  const fallbackUsers: User[] = [
    { id: 1, email: 'admin@example.com', role: 'admin', clients: [], is_active: true },
    { id: 2, email: 'manager@example.com', role: 'client_manager', clients: [{id: 1, name: 'Acme Corp'}, {id: 2, name: 'TechStart'}], is_active: true },
    { id: 3, email: 'user@example.com', role: 'client_user', clients: [{id: 1, name: 'Acme Corp'}], is_active: true }
  ];

  const fallbackClients: Client[] = [
    { id: 1, name: 'Acme Corp', campaign_keywords: 'acme, anvil, roadrunner, coyote' },
    { id: 2, name: 'TechStart', campaign_keywords: 'startup, innovation, tech, AI' },
    { id: 3, name: 'Global Industries', campaign_keywords: 'global, international, worldwide' },
    { id: 4, name: 'Healthcare Plus', campaign_keywords: 'healthcare, medical, wellness' },
    { id: 5, name: 'Finance Partners', campaign_keywords: 'finance, banking, investment' }
  ];

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch users
      let usersData: User[] = [];
      let clientsData: Client[] = [];
      let usersError = false;
      let clientsError = false;

      try {
        const usersResponse = await api.get('/users');
        usersData = usersResponse.data;
        console.log('UserManagement: Successfully fetched users:', usersData.length);
      } catch (error) {
        console.error('Error fetching users:', error);
        usersData = fallbackUsers;
        usersError = true;
        console.log('UserManagement: Using fallback user data');
      }

      // Fetch clients
      try {
        const clientsResponse = await api.get('/clients');
        clientsData = clientsResponse.data;
        console.log('UserManagement: Successfully fetched clients:', clientsData.length);
      } catch (error) {
        console.error('Error fetching clients:', error);
        clientsData = fallbackClients;
        clientsError = true;
        console.log('UserManagement: Using fallback client data');
      }

      // Update state with fetched or fallback data
      setUsers(usersData);
      setClients(clientsData);

      // Show notification if using fallback data
      if (usersError || clientsError) {
        setNotification({
          open: true,
          message: 'Using fallback data due to API errors',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      setNotification({
        open: true,
        message: 'Failed to load data',
        severity: 'error'
      });

      // Use fallback data as a last resort
      setUsers(fallbackUsers);
      setClients(fallbackClients);
    } finally {
      setLoading(false);
    }
  }, []);

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
        try {
          // First update the user's basic information
          const userUpdateData = {
            email: userForm.email,
            password: userForm.password || undefined,
            role: userForm.role
          };

          await api.put(`/users/${selectedUser.id}`, userUpdateData);

          // Then assign clients using the new endpoint
          const existingClientIds = selectedUser.clients.map(client => client.id);
          const clientsToAdd = userForm.clients.filter(clientId => !existingClientIds.includes(clientId));

          // Assign each new client
          for (const clientId of clientsToAdd) {
            await api.post(`/users/${selectedUser.id}/clients`, { client_id: clientId });
          }

          setNotification({
            open: true,
            message: 'User updated successfully',
            severity: 'success'
          });

          // Reload data to get the updated user with correct client assignments
          await loadData();
        } catch (apiError: any) {
          console.error('API error updating user:', apiError);

          setNotification({
            open: true,
            message: apiError.response?.data?.detail || 'Error updating user',
            severity: 'error'
          });
        }
      } else {
        // Create new user
        try {
          // First create the user with basic information
          const userCreateData = {
            email: userForm.email,
            password: userForm.password,
            role: userForm.role
          };

          const response = await api.post('/users', userCreateData);
          const newUserId = response.data.id;

          // Then assign clients using the new endpoint
          for (const clientId of userForm.clients) {
            await api.post(`/users/${newUserId}/clients`, { client_id: clientId });
          }

          setNotification({
            open: true,
            message: 'User created successfully',
            severity: 'success'
          });

          // Reload data to get the new user with correct client assignments
          await loadData();
        } catch (apiError: any) {
          console.error('API error creating user:', apiError);

          setNotification({
            open: true,
            message: apiError.response?.data?.detail || 'Error creating user',
            severity: 'error'
          });
        }
      }

      setUserFormOpen(false);
    } catch (error: any) {
      console.error('Error in handleSubmitUser:', error);
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
      try {
        await api.delete(`/users/${userToDelete.id}`);

        setNotification({
          open: true,
          message: 'User deleted successfully',
          severity: 'success'
        });
      } catch (apiError) {
        console.error('API error deleting user:', apiError);

        // Show warning but proceed with local deletion
        setNotification({
          open: true,
          message: 'API error deleting user, but removed locally',
          severity: 'warning'
        });
      }

      // Update local state to remove the user
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error in handleConfirmDelete:', error);
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
      } catch (apiError) {
        console.error('API error resetting password:', apiError);

        // Show warning but assume it worked
        setNotification({
          open: true,
          message: 'API error resetting password, but operation may have succeeded',
          severity: 'warning'
        });
      }

      setResetPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error in handleConfirmResetPassword:', error);
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
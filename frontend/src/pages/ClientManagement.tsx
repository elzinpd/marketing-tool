import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, Box, Paper, Button, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Chip, 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, CircularProgress,
  Alert, Snackbar, Breadcrumbs, Link
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Client } from '../types';
import { getClients, createClient, updateClient, deleteClient } from '../api/clientService';

const ClientManagement: React.FC = () => {
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    campaign_keywords: '',
  });
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info' as 'info' | 'success' | 'error'
  });

  // Navigation
  const navigate = useNavigate();

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Fetch clients from API
  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      setError('Failed to load clients. Please try again.');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Open dialog for creating a new client
  const handleOpenCreateDialog = () => {
    setSelectedClient(null);
    setClientForm({
      name: '',
      campaign_keywords: '',
    });
    setOpenDialog(true);
  };

  // Open dialog for editing an existing client
  const handleOpenEditDialog = (client: Client) => {
    console.log('Opening edit dialog for client:', client);
    
    setSelectedClient(client);
    setClientForm({
      name: client.name || '',
      campaign_keywords: typeof client.campaign_keywords === 'string' 
        ? client.campaign_keywords 
        : client.campaign_keywords_list?.join(', ') || '',
    });
    
    console.log('Set client form to:', {
      name: client.name || '',
      campaign_keywords: typeof client.campaign_keywords === 'string' 
        ? client.campaign_keywords 
        : client.campaign_keywords_list?.join(', ') || '',
    });
    
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClientForm({ ...clientForm, [name]: value });
  };

  // Submit form (create or update client)
  const handleSubmit = async () => {
    try {
      console.log('Form data being submitted:', clientForm);
      
      if (selectedClient) {
        // Update existing client
        console.log('Updating client with ID:', selectedClient.id);
        const updatedClient = await updateClient(selectedClient.id, clientForm);
        console.log('Client updated successfully:', updatedClient);
        setNotification({
          open: true,
          message: `Client "${clientForm.name}" updated successfully!`,
          severity: 'success'
        });
      } else {
        // Create new client
        console.log('Creating new client');
        const newClient = await createClient(clientForm);
        console.log('Client created successfully:', newClient);
        setNotification({
          open: true,
          message: `Client "${clientForm.name}" created successfully!`,
          severity: 'success'
        });
      }
      setOpenDialog(false);
      loadClients(); // Refresh the client list
    } catch (err) {
      console.error('Error saving client:', err);
      setNotification({
        open: true,
        message: `Error: ${selectedClient ? 'updating' : 'creating'} client failed.`,
        severity: 'error'
      });
    }
  };

  // Delete a client
  const handleDelete = async (client: Client) => {
    if (window.confirm(`Are you sure you want to delete client "${client.name}"?`)) {
      try {
        await deleteClient(client.id);
        setNotification({
          open: true,
          message: `Client "${client.name}" deleted successfully!`,
          severity: 'success'
        });
        loadClients(); // Refresh the client list
      } catch (err) {
        setNotification({
          open: true,
          message: 'Error: Failed to delete client.',
          severity: 'error'
        });
        console.error('Error deleting client:', err);
      }
    }
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Convert comma-separated keywords to array
  const formatKeywords = (keywordsString: string) => {
    return keywordsString.split(',').map(k => k.trim()).filter(k => k);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/admin">Admin</Link>
          <Typography color="text.primary">Client Management</Typography>
        </Breadcrumbs>
        <Typography variant="h4" component="h1" gutterBottom>
          Client Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Create and manage clients and their campaign keywords
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Action Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          Add New Client
        </Button>
      </Box>

      {/* Clients Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="clients table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Campaign Keywords</TableCell>
                <TableCell width={120}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                    No clients found. Click "Add New Client" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell>{client.id}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>
                      {client.campaign_keywords_list 
                        ? client.campaign_keywords_list.map((keyword, idx) => (
                            <Chip 
                              key={idx} 
                              label={keyword} 
                              size="small" 
                              sx={{ mr: 0.5, mb: 0.5 }} 
                            />
                          ))
                        : typeof client.campaign_keywords === 'string'
                          ? formatKeywords(client.campaign_keywords).map((keyword, idx) => (
                              <Chip 
                                key={idx} 
                                label={keyword} 
                                size="small" 
                                sx={{ mr: 0.5, mb: 0.5 }} 
                              />
                            ))
                          : null
                      }
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleOpenEditDialog(client)}
                        aria-label="edit client"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => handleDelete(client)}
                        aria-label="delete client"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedClient ? `Edit Client: ${selectedClient.name}` : 'Create New Client'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Client Name"
              name="name"
              autoFocus
              value={clientForm.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="campaign_keywords"
              label="Campaign Keywords (comma-separated)"
              name="campaign_keywords"
              placeholder="keyword1, keyword2, keyword3"
              multiline
              rows={4}
              value={clientForm.campaign_keywords}
              onChange={handleInputChange}
              helperText="Enter keywords that will be used to match campaigns from LinkedIn and Rollworks"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedClient ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ClientManagement; 
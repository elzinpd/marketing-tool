import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Typography, Paper, Divider, Button, 
  TextField, Grid, Card, CardContent, CardHeader, 
  List, ListItem, ListItemText, ListItemIcon, 
  Switch, FormControlLabel, Alert, Snackbar,
  Tabs, Tab, CircularProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, Slider, MenuItem
} from '@mui/material';
import { 
  VpnKey as PasswordIcon, 
  Save as SaveIcon,
  Api as ApiIcon, 
  Check as CheckIcon,
  Error as ErrorIcon,
  LinkedIn as LinkedInIcon,
  Facebook as FacebookIcon,
  Language as GenericApiIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

// Define types for API status
interface ApiStatus {
  name: string;
  connected: boolean;
  lastSync?: string;
  icon: React.ReactNode;
  details?: string;
}

// Password form type
interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const SystemSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // API statuses updated to accurately reflect current state (all in development)
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([
    {
      name: 'LinkedIn Marketing API',
      connected: false,
      lastSync: '2025-04-04 16:30:00',
      icon: <LinkedInIcon />,
      details: 'Client ID: li_59872af\nEndpoints: Campaigns, Metrics\nStatus: In development (80% complete)\nNote: Campaign API structure implemented, authentication pending'
    },
    {
      name: 'Google Analytics',
      connected: false,
      lastSync: '2025-04-04 17:15:00',
      icon: <GenericApiIcon />,
      details: 'Property ID: GA-43928571\nConnected Views: Pending\nStatus: In development (65% complete)\nMetrics: Sessions, Users, Pageviews, Conversions'
    },
    {
      name: 'Facebook Ads API',
      connected: false,
      icon: <FacebookIcon />,
      details: 'Status: In development (40% complete)\nMissing: Authentication token\nNote: Basic structure implemented, awaiting access credentials'
    },
    {
      name: 'Google Ads API',
      connected: false,
      lastSync: undefined,
      icon: <GenericApiIcon />,
      details: 'Client ID: Pending\nStatus: In development (50% complete)\nNote: API structure defined, authentication flow in progress'
    },
    {
      name: 'Twitter Ads API',
      connected: false,
      icon: <GenericApiIcon />,
      details: 'Status: Development in progress (30% complete)\nPlanned completion: Q2 2025\nFeatures being developed: Campaign metrics, Audience insights'
    },
    {
      name: 'HubSpot API',
      connected: false,
      lastSync: undefined,
      icon: <GenericApiIcon />,
      details: 'API Key: Pending\nConnected portals: 0\nStatus: In development (25% complete)\nNote: Initial integration started'
    }
  ]);

  // Planned integrations state with more details
  const [plannedIntegrations, setPlannedIntegrations] = useState([
    {
      name: "TikTok Ads API",
      plannedDate: "Q3 2025",
      description: "Campaign metrics and creative assets",
      priority: "Medium",
      status: "Planned"
    },
    {
      name: "Reddit Ads API",
      plannedDate: "Q4 2025",
      description: "Basic metrics integration",
      priority: "Low",
      status: "Planned"
    },
    {
      name: "Bing Ads API",
      plannedDate: "Q2 2025",
      description: "Campaign performance metrics",
      priority: "Medium",
      status: "Under review"
    }
  ]);

  // State for editing planned integrations
  const [editingIntegration, setEditingIntegration] = useState<{
    index: number;
    integration: any;
  } | null>(null);
  
  // State for progress update dialog
  const [progressUpdateOpen, setProgressUpdateOpen] = useState(false);
  const [progressUpdateData, setProgressUpdateData] = useState<{
    apiName: string;
    currentProgress: number;
    notes: string;
  }>({
    apiName: '',
    currentProgress: 0,
    notes: ''
  });

  const [selectedApi, setSelectedApi] = useState<ApiStatus | null>(null);
  const [apiDetailsOpen, setApiDetailsOpen] = useState(false);

  // Handle API details dialog
  const handleOpenApiDetails = (api: ApiStatus) => {
    setSelectedApi(api);
    setApiDetailsOpen(true);
  };

  const handleCloseApiDetails = () => {
    setApiDetailsOpen(false);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle password form changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  // Handle password update submission
  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotification({
        open: true,
        message: 'New password and confirmation do not match',
        severity: 'error'
      });
      setLoading(false);
      return;
    }

    // Mock API call - in a real app, this would be an actual API request
    setTimeout(() => {
      setLoading(false);
      setNotification({
        open: true,
        message: 'Password updated successfully',
        severity: 'success'
      });
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }, 1000);
  };

  // Handle opening the edit planned integration dialog
  const handleEditPlannedIntegration = (index: number) => {
    setEditingIntegration({
      index,
      integration: { ...plannedIntegrations[index] }
    });
  };

  // Handle closing the edit planned integration dialog
  const handleCloseEditIntegration = () => {
    setEditingIntegration(null);
  };

  // Handle saving the edited planned integration
  const handleSavePlannedIntegration = () => {
    if (!editingIntegration) return;
    
    const newIntegrations = [...plannedIntegrations];
    newIntegrations[editingIntegration.index] = editingIntegration.integration;
    setPlannedIntegrations(newIntegrations);
    setEditingIntegration(null);
    setNotification({
      open: true,
      message: 'Integration plan updated successfully',
      severity: 'success'
    });
  };

  // Handle opening the progress update dialog
  const handleOpenProgressUpdate = (apiName: string) => {
    const api = apiStatuses.find(api => api.name === apiName);
    const progressMatch = api?.details?.match(/\((\d+)% complete\)/);
    const currentProgress = progressMatch ? parseInt(progressMatch[1]) : 0;
    
    setProgressUpdateData({
      apiName,
      currentProgress,
      notes: ''
    });
    setProgressUpdateOpen(true);
  };

  // Handle closing the progress update dialog
  const handleCloseProgressUpdate = () => {
    setProgressUpdateOpen(false);
  };

  // Handle saving the progress update
  const handleSaveProgressUpdate = () => {
    const updatedStatuses = apiStatuses.map(api => {
      if (api.name === progressUpdateData.apiName) {
        // Update the progress percentage in the details
        const updatedDetails = api.details?.replace(
          /\(\d+% complete\)/, 
          `(${progressUpdateData.currentProgress}% complete)`
        );
        
        // Append the notes to the details if provided
        const finalDetails = progressUpdateData.notes 
          ? `${updatedDetails}\nUpdate note: ${progressUpdateData.notes}` 
          : updatedDetails;
        
        return {
          ...api,
          details: finalDetails,
          // If progress reaches 100%, mark as connected
          connected: progressUpdateData.currentProgress === 100
        };
      }
      return api;
    });
    
    setApiStatuses(updatedStatuses);
    setProgressUpdateOpen(false);
    setNotification({
      open: true,
      message: `Progress updated for ${progressUpdateData.apiName}`,
      severity: 'success'
    });
  };

  // Handle form change for progress update
  const handleProgressUpdateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProgressUpdateData({
      ...progressUpdateData,
      [name]: name === 'currentProgress' ? parseInt(value) : value
    });
  };

  // Handle adding a new planned integration
  const handleAddPlannedIntegration = () => {
    const newIntegration = {
      name: "New API Integration",
      plannedDate: "Q4 2025",
      description: "Description pending",
      priority: "Medium",
      status: "Planned"
    };
    
    setPlannedIntegrations([...plannedIntegrations, newIntegration]);
    setEditingIntegration({
      index: plannedIntegrations.length,
      integration: newIntegration
    });
  };

  // Handle API refresh (keeping this for backwards compatibility)
  const handleRefreshApi = (apiName: string) => {
    setLoading(true);
    // In a real application, this would make an API call to refresh the connection
    setTimeout(() => {
      const updatedStatuses = apiStatuses.map(api => {
        if (api.name === apiName) {
          return {
            ...api,
            lastSync: new Date().toLocaleString(),
            connected: true
          };
        }
        return api;
      });
      setApiStatuses(updatedStatuses);
      setLoading(false);
      setNotification({
        open: true,
        message: `${apiName} connection refreshed successfully`,
        severity: 'success'
      });
    }, 1500);
  };

  // Handle notification close
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Render the password management section (for all roles)
  const renderPasswordSection = () => (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <PasswordIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">Password Management</Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />
      
      <form onSubmit={handlePasswordUpdate}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              name="currentPassword"
              label="Current Password"
              type="password"
              fullWidth
              required
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="newPassword"
              label="New Password"
              type="password"
              fullWidth
              required
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              fullWidth
              required
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              type="submit"
              variant="contained" 
              color="primary"
              startIcon={<SaveIcon />}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Update Password'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );

  // Render the API management section with improved display and editing options
  const renderApiManagementSection = () => (
    <>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <ApiIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">API Connections</Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            All API integrations are currently in development. None are fully operational at this time.
          </Typography>
        </Box>
        
        <List>
          {apiStatuses.map((api, index) => (
            <ListItem 
              key={index} 
              divider={index < apiStatuses.length - 1}
              button
              onClick={() => handleOpenApiDetails(api)}
              sx={{ 
                py: 2,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <ListItemIcon>
                {api.icon}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box display="flex" alignItems="center">
                    {api.name}
                    <Chip 
                      size="small" 
                      label="In Development" 
                      color="warning" 
                      sx={{ ml: 1 }} 
                    />
                  </Box>
                }
                secondary={
                  api.details?.includes('progress') 
                    ? `Development: ${api.details.split('\n').find(line => line.includes('% complete')) || 'In progress'}` 
                    : 'Not started'
                }
              />
              <Chip 
                icon={<ErrorIcon />}
                label="Inactive"
                color="error"
                variant="outlined"
                sx={{ mr: 2 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenProgressUpdate(api.name);
                }}
                disabled={loading}
              >
                Update Progress
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <ApiIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Integration Roadmap</Typography>
          </Box>
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            onClick={handleAddPlannedIntegration}
          >
            Add New Integration
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="body2" paragraph>
          The following API integrations are planned for future development:
        </Typography>
        
        <List dense>
          {plannedIntegrations.map((integration, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <Button 
                  size="small" 
                  onClick={() => handleEditPlannedIntegration(index)}
                  variant="outlined"
                >
                  Edit
                </Button>
              }
            >
              <ListItemIcon>
                <GenericApiIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary={integration.name} 
                secondary={
                  <>
                    {`${integration.plannedDate} - ${integration.description}`}
                    <Box mt={0.5}>
                      <Chip 
                        label={integration.status} 
                        color={integration.status === "Planned" ? "info" : "warning"} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={`Priority: ${integration.priority}`} 
                        size="small" 
                        variant="outlined" 
                        sx={{ ml: 1 }} 
                      />
                    </Box>
                  </>
                } 
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Dialog for editing planned integrations */}
      <Dialog 
        open={editingIntegration !== null} 
        onClose={handleCloseEditIntegration}
        maxWidth="sm"
        fullWidth
      >
        {editingIntegration && (
          <>
            <DialogTitle>Edit Planned Integration</DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Name"
                    value={editingIntegration.integration.name}
                    onChange={(e) => setEditingIntegration({
                      ...editingIntegration,
                      integration: {
                        ...editingIntegration.integration,
                        name: e.target.value
                      }
                    })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Planned Date"
                    value={editingIntegration.integration.plannedDate}
                    onChange={(e) => setEditingIntegration({
                      ...editingIntegration,
                      integration: {
                        ...editingIntegration.integration,
                        plannedDate: e.target.value
                      }
                    })}
                    margin="normal"
                    placeholder="e.g., Q2 2025"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Priority"
                    value={editingIntegration.integration.priority}
                    onChange={(e) => setEditingIntegration({
                      ...editingIntegration,
                      integration: {
                        ...editingIntegration.integration,
                        priority: e.target.value
                      }
                    })}
                    margin="normal"
                  >
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={editingIntegration.integration.status}
                    onChange={(e) => setEditingIntegration({
                      ...editingIntegration,
                      integration: {
                        ...editingIntegration.integration,
                        status: e.target.value
                      }
                    })}
                    margin="normal"
                  >
                    <MenuItem value="Planned">Planned</MenuItem>
                    <MenuItem value="Under review">Under review</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="On hold">On hold</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={editingIntegration.integration.description}
                    onChange={(e) => setEditingIntegration({
                      ...editingIntegration,
                      integration: {
                        ...editingIntegration.integration,
                        description: e.target.value
                      }
                    })}
                    margin="normal"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseEditIntegration}>Cancel</Button>
              <Button 
                onClick={handleSavePlannedIntegration} 
                variant="contained" 
                color="primary"
              >
                Save Changes
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog for API progress update */}
      <Dialog
        open={progressUpdateOpen}
        onClose={handleCloseProgressUpdate}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update API Development Progress</DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            {progressUpdateData.apiName}
          </Typography>
          
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Current Progress: {progressUpdateData.currentProgress}%
            </Typography>
            <Slider
              name="currentProgress"
              value={progressUpdateData.currentProgress}
              onChange={(e, value) => setProgressUpdateData({
                ...progressUpdateData,
                currentProgress: value as number
              })}
              valueLabelDisplay="auto"
              step={5}
              marks
              min={0}
              max={100}
            />
          </Box>
          
          <TextField
            name="notes"
            label="Progress Notes"
            value={progressUpdateData.notes}
            onChange={handleProgressUpdateChange}
            fullWidth
            multiline
            rows={3}
            placeholder="Describe what has been accomplished and what remains to be done"
            margin="normal"
          />
          
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Note: Setting progress to 100% will automatically mark this API as active
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProgressUpdate}>Cancel</Button>
          <Button 
            onClick={handleSaveProgressUpdate} 
            variant="contained" 
            color="primary"
          >
            Update Progress
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={apiDetailsOpen} onClose={handleCloseApiDetails} maxWidth="sm" fullWidth>
        {selectedApi && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center">
                {selectedApi.icon}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {selectedApi.name}
                </Typography>
                <Chip 
                  icon={<ErrorIcon />}
                  label="In Development"
                  color="warning"
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Status</Typography>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 1, 
                    bgcolor: 'warning.lightest',
                    border: 1,
                    borderColor: 'warning.light'
                  }}>
                    <Typography>
                      This API integration is in development and not yet available for use.
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Implementation Progress</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={selectedApi.details?.includes('(80%') ? 80 :
                               selectedApi.details?.includes('(65%') ? 65 :
                               selectedApi.details?.includes('(50%') ? 50 :
                               selectedApi.details?.includes('(40%') ? 40 :
                               selectedApi.details?.includes('(30%') ? 30 :
                               selectedApi.details?.includes('(25%') ? 25 : 20} 
                        color="warning"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {selectedApi.details?.includes('(80%') ? '80%' :
                       selectedApi.details?.includes('(65%') ? '65%' :
                       selectedApi.details?.includes('(50%') ? '50%' :
                       selectedApi.details?.includes('(40%') ? '40%' :
                       selectedApi.details?.includes('(30%') ? '30%' :
                       selectedApi.details?.includes('(25%') ? '25%' : '20%'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Development Details</Typography>
                  {selectedApi.details?.split('\n').map((detail, idx) => (
                    <Typography key={idx} variant="body2" paragraph={false} sx={{ mb: 0.5 }}>
                      {detail}
                    </Typography>
                  ))}
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Planned Features</Typography>
                  <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                    {selectedApi.name === 'LinkedIn Marketing API' && (
                      <>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Campaign metrics retrieval (in development)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Profile information (in development)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Ad performance data (planned)</Typography>
                      </>
                    )}
                    {selectedApi.name === 'Google Analytics' && (
                      <>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>User metrics and demographics (in development)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Page performance data (in development)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Conversion tracking (planned)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Custom event tracking (planned)</Typography>
                      </>
                    )}
                    {selectedApi.name === 'Facebook Ads API' && (
                      <>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Campaign metrics (in development)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Ad creative analysis (planned)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Audience insights (planned)</Typography>
                      </>
                    )}
                    {selectedApi.name === 'Google Ads API' && (
                      <>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Search campaign metrics (in development)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Display campaign metrics (in development)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Campaign creation (planned)</Typography>
                      </>
                    )}
                    {selectedApi.name === 'Twitter Ads API' && (
                      <>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Campaign metrics (in development)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Audience insights (planned)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Tweet performance (planned)</Typography>
                      </>
                    )}
                    {selectedApi.name === 'HubSpot API' && (
                      <>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Contact retrieval (in development)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Deal information (planned)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Contact creation (planned)</Typography>
                        <Typography component="li" sx={{ color: 'text.disabled' }}>Deal management (planned)</Typography>
                      </>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Development Timeline</Typography>
                  <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                    <Typography component="li">Initial Setup: Completed</Typography>
                    <Typography component="li">API Structure: {selectedApi.details?.includes('(50%') || selectedApi.details?.includes('(65%') || selectedApi.details?.includes('(80%') ? 'Completed' : 'In Progress'}</Typography>
                    <Typography component="li">Authentication Flow: {selectedApi.details?.includes('(65%') || selectedApi.details?.includes('(80%') ? 'Completed' : 'In Progress'}</Typography>
                    <Typography component="li">Data Retrieval: {selectedApi.details?.includes('(80%') ? 'In Testing' : 'Pending'}</Typography>
                    <Typography component="li">Production Deployment: Pending</Typography>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Box sx={{ mr: 'auto', ml: 2, my: 1 }}>
                <Button
                  color="primary"
                  onClick={() => handleOpenProgressUpdate(selectedApi.name)}
                  disabled={loading}
                >
                  Update Development Progress
                </Button>
              </Box>
              <Button onClick={handleCloseApiDetails}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {user?.role === 'admin' 
            ? 'Manage system-wide settings and API connections' 
            : 'Manage your account settings'}
        </Typography>
      </Box>

      {user?.role === 'admin' ? (
        // Admin view with tabs
        <>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ mb: 3 }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab label="API Connections" />
            <Tab label="Account Settings" />
          </Tabs>
          
          {tabValue === 0 && renderApiManagementSection()}
          {tabValue === 1 && renderPasswordSection()}
        </>
      ) : (
        // Client manager or agency head view - just password management
        renderPasswordSection()
      )}

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
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

export default SystemSettings; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { downloadClientReport } from '../services/api';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Divider,
  TextField,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  FileDownload as ExportIcon,
  Assessment as ReportIcon,
  Refresh as RefreshIcon,
  ArrowUpward,
  ArrowDownward,
  GetApp
} from '@mui/icons-material';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

// Interface definitions
interface Campaign {
  id: number | string;
  name: string;
  platform: string;
  status: string;
  startDate?: string;
  endDate?: string;
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    ctr?: number;
    conversionRate?: number;
    cpc?: number;
  };
}

interface Client {
  id: number;
  name: string;
  campaign_keywords?: string;
  campaigns?: Campaign[];
}

interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Define preset date ranges
const dateRangePresets = {
  last7Days: {
    label: 'Last 7 Days',
    startDate: subDays(new Date(), 7),
    endDate: new Date()
  },
  last30Days: {
    label: 'Last 30 Days',
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  },
  thisMonth: {
    label: 'This Month',
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  }
};

const ClientDashboards: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRanges, setDateRanges] = useState<Record<number, DateRange>>({});
  const [activeTab, setActiveTab] = useState<number>(0);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch client data the user has access to
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get clients that the current user has access to
        const response = await api.get('/clients/assigned');
        
        // Initialize date ranges for each client
        const initialDateRanges: Record<number, DateRange> = {};
        response.data.forEach((client: Client) => {
          initialDateRanges[client.id] = {
            startDate: dateRangePresets.last30Days.startDate,
            endDate: dateRangePresets.last30Days.endDate
          };
        });
        
        setClients(response.data);
        setDateRanges(initialDateRanges);
        
        // Fetch campaign data for each client
        const clientsWithCampaigns = await Promise.all(
          response.data.map(async (client: Client) => {
            try {
              // We'll fetch campaigns from the backend filtered by client
              const campaignsResponse = await api.get(
                `/linkedin/campaigns?client_id=${client.id}`
              );
              
              return {
                ...client,
                campaigns: campaignsResponse.data || []
              };
            } catch (error) {
              console.error(`Error fetching campaigns for client ${client.id}:`, error);
              return {
                ...client,
                campaigns: []
              };
            }
          })
        );
        
        setClients(clientsWithCampaigns);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set notification for error
        setNotification({
          open: true,
          message: 'Failed to load client data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Function to handle date range change for a specific client
  const handleDateRangeChange = (clientId: number, field: 'startDate' | 'endDate', date: Date | null) => {
    if (!date) return;
    
    setDateRanges(prev => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [field]: date
      }
    }));
  };
  
  // Function to apply preset date range to a client
  const applyPresetDateRange = (clientId: number, preset: keyof typeof dateRangePresets) => {
    setDateRanges(prev => ({
      ...prev,
      [clientId]: {
        startDate: dateRangePresets[preset].startDate,
        endDate: dateRangePresets[preset].endDate
      }
    }));
  };
  
  // Function to handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Function to export dashboard to PowerPoint
  const handleExportToPowerPoint = async (clientId: number) => {
    setExporting(true);
    
    try {
      // Check for token first
      const token = localStorage.getItem('token');
      if (!token) {
        setNotification({
          open: true,
          message: 'Your session has expired. Please log in again.',
          severity: 'error'
        });
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      const dateRange = dateRanges[clientId] || { 
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
        endDate: new Date() 
      };
      
      const startDate = format(dateRange.startDate, 'yyyy-MM-dd');
      const endDate = format(dateRange.endDate, 'yyyy-MM-dd');
      
      // Find client name for the notification
      const client = clients.find(c => c.id === clientId);
      const clientName = client ? client.name : `Client ${clientId}`;
      
      setNotification({
        open: true,
        message: `Generating PowerPoint report for ${clientName}...`,
        severity: 'info'
      });
      
      console.log(`Requesting report for client ${clientId} from ${startDate} to ${endDate}`);
      
      await downloadClientReport(clientId, startDate, endDate);
      
      setNotification({
        open: true,
        message: `${clientName} report downloaded successfully!`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting to PowerPoint:', error);
      let errorMessage = 'Failed to generate report. Please try again.';
      
      // Check if it's an authentication error
      if (error instanceof Error && 
          (error.message.includes('401') || 
           error.message.toLowerCase().includes('unauthorized') || 
           error.message.includes('Authentication token'))) {
        errorMessage = 'Your session has expired. Please log in again.';
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
      
      setNotification({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setExporting(false);
    }
  };
  
  // Function to refresh client data
  const handleRefreshData = async (clientId: number) => {
    try {
      setLoading(true);
      
      // Refresh campaigns for this client
      const campaignsResponse = await api.get(
        `/linkedin/campaigns?client_id=${clientId}`
      );
      
      // Update the specific client with new campaign data
      setClients(prev => 
        prev.map(client => 
          client.id === clientId 
            ? { ...client, campaigns: campaignsResponse.data || [] } 
            : client
        )
      );
      
      setNotification({
        open: true,
        message: 'Dashboard data refreshed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      setNotification({
        open: true,
        message: 'Failed to refresh dashboard data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle notification close
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };
  
  // Calculate metrics totals for a client's campaigns
  const calculateTotals = (campaigns: Campaign[] = []) => {
    return campaigns.reduce((totals, campaign) => {
      if (campaign.metrics) {
        return {
          impressions: totals.impressions + (campaign.metrics.impressions || 0),
          clicks: totals.clicks + (campaign.metrics.clicks || 0),
          conversions: totals.conversions + (campaign.metrics.conversions || 0),
          spend: totals.spend + (campaign.metrics.spend || 0)
        };
      }
      return totals;
    }, { impressions: 0, clicks: 0, conversions: 0, spend: 0 });
  };
  
  // Calculate derived metrics
  const calculateDerivedMetrics = (metrics: { impressions: number, clicks: number, conversions: number, spend: number }) => {
    const { impressions, clicks, conversions, spend } = metrics;
    
    return {
      ...metrics,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      costPerConversion: conversions > 0 ? spend / conversions : 0
    };
  };
  
  // Add additional metrics and insights to the dashboard
  const renderClientMetrics = (clientId: number) => {
    const campaigns = clients.find(c => c.id === clientId)?.campaigns || [];
    if (campaigns.length === 0) return <Typography>No campaign data available</Typography>;
    
    // Calculate campaign metrics (same calculation logic as in the reports)
    const totalImpressions = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.impressions || 0), 0);
    const totalClicks = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.clicks || 0), 0);
    const totalConversions = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.conversions || 0), 0);
    const totalSpend = campaigns.reduce((sum, campaign) => sum + (campaign.metrics?.spend || 0), 0);
    
    // Calculate derived metrics
    const ctr = totalClicks / totalImpressions || 0;
    const conversionRate = totalConversions / totalClicks || 0;
    const cpc = totalSpend / totalClicks || 0;
    const costPerConversion = totalSpend / totalConversions || 0;
    const roi = ((totalConversions * 100) - totalSpend) / totalSpend || 0;
    
    // Mock week-over-week and month-over-month changes
    const wowChange = (Math.random() * 0.4 - 0.15); // -15% to +25% change
    const momChange = (Math.random() * 0.4 - 0.1);  // -10% to +30% change
    
    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* Key Metrics Section - Correlates with x3-x7 in the template */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Key Performance Metrics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Total Impressions (x3)</Typography>
                    <Typography variant="h5">{totalImpressions.toLocaleString()}</Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      color: wowChange >= 0 ? 'success.main' : 'error.main' 
                    }}>
                      {wowChange >= 0 ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                      <Typography variant="body2">
                        {Math.abs(wowChange * 100).toFixed(1)}% WoW
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Total Clicks (x4)</Typography>
                    <Typography variant="h5">{totalClicks.toLocaleString()}</Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      color: momChange >= 0 ? 'success.main' : 'error.main' 
                    }}>
                      {momChange >= 0 ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                      <Typography variant="body2">
                        {Math.abs(momChange * 100).toFixed(1)}% MoM
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Total Conversions (x5)</Typography>
                    <Typography variant="h5">{totalConversions.toLocaleString()}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Total Spend (x6)</Typography>
                    <Typography variant="h5">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">CTR (x7)</Typography>
                    <Typography variant="h5">{(ctr * 100).toFixed(2)}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Conversion Rate (x8)</Typography>
                    <Typography variant="h5">{(conversionRate * 100).toFixed(2)}%</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Advanced Metrics Section - Correlates with additional insights in the template */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Performance Insights</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Cost Per Click (x9)</Typography>
                    <Typography variant="h5">${cpc.toFixed(2)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">Cost Per Conversion (x10)</Typography>
                    <Typography variant="h5">${costPerConversion.toFixed(2)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">ROI (x11)</Typography>
                    <Typography variant="h5">{(roi * 100).toFixed(1)}%</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Campaign Summary - Correlates with campaign details in the template */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Campaign Summary (x14: {campaigns.length} campaigns)</Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<GetApp />}
                  onClick={() => handleExportToPowerPoint(clientId)}
                  disabled={exporting}
                >
                  {exporting ? 'Generating...' : 'Export to PowerPoint'}
                </Button>
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Campaign Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Impressions</TableCell>
                      <TableCell align="right">Clicks</TableCell>
                      <TableCell align="right">Conv.</TableCell>
                      <TableCell align="right">Spend</TableCell>
                      <TableCell align="right">CTR</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell>{campaign.name}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={campaign.status} 
                            color={
                              campaign.status === 'Active' ? 'success' : 
                              campaign.status === 'Paused' ? 'warning' : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell align="right">{(campaign.metrics?.impressions || 0).toLocaleString()}</TableCell>
                        <TableCell align="right">{(campaign.metrics?.clicks || 0).toLocaleString()}</TableCell>
                        <TableCell align="right">{(campaign.metrics?.conversions || 0).toLocaleString()}</TableCell>
                        <TableCell align="right">${(campaign.metrics?.spend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">{((campaign.metrics?.ctr || 0) * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>Client Dashboards</Typography>
          <Typography variant="body1" color="text.secondary">
            View performance metrics for your assigned clients
          </Typography>
        </Box>
        
        {clients.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No clients assigned to your account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Contact your administrator to get access to client dashboards
            </Typography>
          </Paper>
        ) : (
          <>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
              {clients.map((client) => (
                <Tab key={client.id} label={client.name} />
              ))}
            </Tabs>
            
            {clients.map((client, index) => (
              <Box
                key={client.id}
                role="tabpanel"
                hidden={activeTab !== index}
                id={`client-tabpanel-${client.id}`}
                aria-labelledby={`client-tab-${client.id}`}
              >
                {activeTab === index && (
                  <Paper sx={{ p: 3, mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                      <Typography variant="h5">{client.name} Dashboard</Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<RefreshIcon />}
                          onClick={() => handleRefreshData(client.id)}
                        >
                          Refresh
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<ExportIcon />}
                          onClick={() => handleExportToPowerPoint(client.id)}
                          disabled={exporting}
                        >
                          {exporting ? (
                            <>
                              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                              Exporting...
                            </>
                          ) : 'Export to PowerPoint'}
                        </Button>
                      </Box>
                    </Box>
                    
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      <Grid item xs={12} sm={8}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Start Date
                            </Typography>
                            <DatePicker
                              value={dateRanges[client.id]?.startDate}
                              onChange={(date) => handleDateRangeChange(client.id, 'startDate', date)}
                            />
                          </Box>
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              End Date
                            </Typography>
                            <DatePicker
                              value={dateRanges[client.id]?.endDate}
                              onChange={(date) => handleDateRangeChange(client.id, 'endDate', date)}
                            />
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2" color="text.secondary">
                          Presets
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => applyPresetDateRange(client.id, 'last7Days')}
                          >
                            Last 7 Days
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => applyPresetDateRange(client.id, 'last30Days')}
                          >
                            Last 30 Days
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => applyPresetDateRange(client.id, 'thisMonth')}
                          >
                            This Month
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                    
                    <Divider sx={{ mb: 3 }} />
                    
                    {renderClientMetrics(client.id)}
                  </Paper>
                )}
              </Box>
            ))}
          </>
        )}
        
        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
        >
          <Alert
            onClose={handleCloseNotification}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default ClientDashboards; 
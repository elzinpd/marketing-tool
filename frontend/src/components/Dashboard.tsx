import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApi } from '../hooks/useApi';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  SelectChangeEvent,
} from '@mui/material';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { format } from 'date-fns';

interface Client {
  id: number;
  name: string;
  campaign_keywords: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  type: string;
  dailyBudget?: number;
  startDate?: string;
  endDate?: string;
}

interface MetricData {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const api = useApi();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [metrics, setMetrics] = useState<Record<string, MetricData[]>>({});
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/clients');
        setClients(response.data);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    fetchClients();
  }, [api]);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!selectedClient) return;
      
      try {
        const response = await api.get('/linkedin/campaigns');
        setCampaigns(response.data);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };

    fetchCampaigns();
  }, [api, selectedClient]);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!selectedClient || !dateRange[0] || !dateRange[1]) return;

      const metricsData: Record<string, MetricData[]> = {};
      
      for (const campaign of campaigns) {
        try {
          const response = await api.get(`/linkedin/campaigns/${campaign.id}/metrics`, {
            params: {
              start_date: dateRange[0] ? format(dateRange[0], 'yyyy-MM-dd') : '',
              end_date: dateRange[1] ? format(dateRange[1], 'yyyy-MM-dd') : '',
            }
          });
          metricsData[campaign.id] = response.data.elements;
        } catch (error) {
          console.error(`Error fetching metrics for campaign ${campaign.id}:`, error);
        }
      }

      setMetrics(metricsData);
    };

    fetchMetrics();
  }, [api, selectedClient, campaigns, dateRange]);

  const handleClientChange = (event: SelectChangeEvent) => {
    setSelectedClient(event.target.value);
  };

  const handleSync = async () => {
    try {
      await api.post('/linkedin/sync', {});
      // Refresh campaigns and metrics
      const response = await api.get('/linkedin/campaigns');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error syncing campaigns:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Select Client</InputLabel>
                    <Select
                      value={selectedClient}
                      onChange={handleClientChange}
                      label="Select Client"
                    >
                      {clients.map((client) => (
                        <MenuItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <DateRangePicker
                    value={dateRange}
                    onChange={(newValue) => setDateRange(newValue)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSync}
                    fullWidth
                  >
                    Sync Campaigns
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Campaign Performance
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Campaign</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Impressions</TableCell>
                      <TableCell>Clicks</TableCell>
                      <TableCell>Spend</TableCell>
                      <TableCell>Conversions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaigns.map((campaign) => {
                      const campaignMetrics = metrics[campaign.id] || [];
                      const totalMetrics = campaignMetrics.reduce(
                        (acc, metric) => ({
                          impressions: acc.impressions + metric.impressions,
                          clicks: acc.clicks + metric.clicks,
                          spend: acc.spend + metric.spend,
                          conversions: acc.conversions + metric.conversions,
                        }),
                        { impressions: 0, clicks: 0, spend: 0, conversions: 0 }
                      );

                      return (
                        <TableRow key={campaign.id}>
                          <TableCell>{campaign.name}</TableCell>
                          <TableCell>{campaign.status}</TableCell>
                          <TableCell>{totalMetrics.impressions.toLocaleString()}</TableCell>
                          <TableCell>{totalMetrics.clicks.toLocaleString()}</TableCell>
                          <TableCell>${totalMetrics.spend.toFixed(2)}</TableCell>
                          <TableCell>{totalMetrics.conversions.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 
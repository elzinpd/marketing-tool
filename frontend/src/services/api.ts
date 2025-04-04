import axios from 'axios';
import { Campaign, CampaignMetrics, Client, Report, ReportTemplate } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getCampaigns = async (): Promise<Campaign[]> => {
  const response = await api.get('/campaigns/');
  return response.data;
};

export const getCampaign = async (id: number): Promise<Campaign> => {
  const response = await api.get(`/campaigns/${id}`);
  return response.data;
};

export const getCampaignMetrics = async (
  id: number,
  startDate: string,
  endDate: string
): Promise<CampaignMetrics> => {
  const response = await api.get(`/campaigns/${id}/metrics`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
};

export const createCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'>): Promise<Campaign> => {
  const response = await api.post('/campaigns/', campaign);
  return response.data;
};

export const getClients = async (): Promise<Client[]> => {
  const response = await api.get('/clients/');
  return response.data;
};

export const getReportTemplates = async (): Promise<ReportTemplate[]> => {
  const response = await api.get('/report-templates/');
  return response.data;
};

export const generateReport = async (data: {
  client_id: number;
  start_date: string;
  end_date: string;
  template_id: number;
}): Promise<Report> => {
  const response = await api.post('/reports/generate', data);
  return response.data;
};

export const getReports = async (): Promise<Report[]> => {
  const response = await api.get('/reports/');
  return response.data;
};

export default api; 
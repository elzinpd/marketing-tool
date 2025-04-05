import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Campaign, CampaignMetrics, Client, Report, ReportTemplate } from '../types';

// Define token types
interface TokenResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

// Get the API URL from environment variables or use the default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: '/api/v1', // This will be resolved by the Vite proxy in development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Clean the token to ensure no "Bearer" prefix is duplicated
      const cleanToken = token.replace(/^Bearer\s+/i, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
      
      // Log request for debugging (don't show full token)
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    } else {
      console.warn(`API Request without auth token: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Extract request config from error
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.error('Authentication failed:', error.response.data);
      
      // Clear token and redirect to login
      localStorage.removeItem('token');
      
      // Don't redirect during file downloads to avoid interrupting the user flow
      const isFileDownload = originalRequest.url?.includes('/reports/export');
      if (!isFileDownload) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to download a file with authentication
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    // Clean the token to ensure no "Bearer" prefix is duplicated
    const cleanToken = token.replace(/^Bearer\s+/i, '');
    
    console.log(`Initiating file download from: ${url}`);
    
    // Use fetch API for better blob handling
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'Accept': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      },
      credentials: 'include' // Include cookies if they exist
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      console.error(`Download failed with status ${response.status}: ${errorText}`);
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }
    
    // Get the blob from the response
    const blob = await response.blob();
    
    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers.get('Content-Disposition');
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Create a download link and trigger download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }, 100);

    return;
  } catch (error) {
    console.error('File download error:', error);
    throw error;
  }
};

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

export const downloadClientReport = async (clientId: number, startDate: string, endDate: string): Promise<void> => {
  // Test token validity first with a lightweight request
  try {
    await api.get('/auth/me');
  } catch (error) {
    console.error('Authentication check failed before download', error);
    throw new Error('Your session has expired. Please log in again.');
  }
  
  // Proceed with the download if authentication is valid
  const url = `/api/v1/reports/export-client/${clientId}?start_date=${startDate}&end_date=${endDate}`;
  return downloadFile(url, `Client_${clientId}_Report.pptx`);
};

export const getReports = async (): Promise<Report[]> => {
  const response = await api.get('/reports/');
  return response.data;
};

// Login function
export const login = async (email: string, password: string): Promise<TokenResponse> => {
  try {
    const formData = new FormData();
    formData.append('username', email);  // OAuth2 spec uses 'username' even for email
    formData.append('password', password);

    const response = await api.post<TokenResponse>('/auth/token', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data && response.data.access_token) {
      // Store token in localStorage
      localStorage.setItem('token', response.data.access_token);
    }

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout function
export const logout = (): void => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export default api; 
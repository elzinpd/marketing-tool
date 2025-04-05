import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
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

// Add a response interceptor
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

// Helper function to convert object to URLSearchParams
export const toFormData = (data: Record<string, any>): URLSearchParams => {
  const formData = new URLSearchParams();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value.toString());
    }
  });
  return formData;
};

// Helper function to handle OAuth callback
export const handleOAuthCallback = async (
  code: string,
  state?: string,
  provider: string = 'linkedin'
) => {
  try {
    const response = await api.get('/api/v1/auth/callback', {
      params: {
        code,
        state,
        provider,
      },
    });
    return response.data;
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw error;
  }
};

export default api; 
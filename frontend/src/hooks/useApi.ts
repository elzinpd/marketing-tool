import { useCallback, useMemo } from 'react';
import axios, { AxiosError } from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = 'http://localhost:8000/api/v1';

interface ErrorResponse {
  message?: string;
  [key: string]: any;
}

export const useApi = () => {
  const { user, logout } = useAuth();
  const token = user?.token;

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add request interceptor to add token
    instance.interceptors.request.use(
      (config) => {
        // Only add token if it exists and is not empty
        if (token && token.trim() !== '') {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    instance.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.log('Unauthorized access, logging out');
          logout();
        } else if (error.response?.status === 403) {
          console.error('Forbidden access');
        } else if (!error.response) {
          console.error('Network error:', error.message);
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [token, logout]);

  const handleError = useCallback((error: any, operation: string) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorResponse>;
      if (!axiosError.response) {
        console.error(`Network error during ${operation}:`, axiosError.message);
        throw new Error('Network error. Please check your connection.');
      }
      const errorMessage = axiosError.response.data?.message || axiosError.message;
      console.error(`${operation} failed:`, errorMessage);
      throw new Error(errorMessage);
    }
    console.error(`Unexpected error during ${operation}:`, error);
    throw error;
  }, []);

  const get = useCallback(async (endpoint: string) => {
    try {
      return await api.get(endpoint);
    } catch (error) {
      return handleError(error, `GET ${endpoint}`);
    }
  }, [api, handleError]);

  const post = useCallback(async (endpoint: string, data: any) => {
    try {
      return await api.post(endpoint, data);
    } catch (error) {
      return handleError(error, `POST ${endpoint}`);
    }
  }, [api, handleError]);

  const put = useCallback(async (endpoint: string, data: any) => {
    try {
      return await api.put(endpoint, data);
    } catch (error) {
      return handleError(error, `PUT ${endpoint}`);
    }
  }, [api, handleError]);

  const del = useCallback(async (endpoint: string) => {
    try {
      return await api.delete(endpoint);
    } catch (error) {
      return handleError(error, `DELETE ${endpoint}`);
    }
  }, [api, handleError]);

  return {
    get,
    post,
    put,
    delete: del
  };
}; 
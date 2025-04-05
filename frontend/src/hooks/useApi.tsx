import { useCallback } from 'react';
import axios, { AxiosResponse } from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:8000/api/v1';

export const useApi = () => {
  const { token } = useAuth();

  const getHeaders = useCallback(() => {
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  }, [token]);

  const get = useCallback(async (endpoint: string): Promise<any> => {
    try {
      console.log(`Making GET request to: ${API_URL}${endpoint}`);
      const response: AxiosResponse = await axios.get(`${API_URL}${endpoint}`, {
        headers: getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error in GET ${endpoint}:`, error);
      throw error;
    }
  }, [getHeaders]);

  const post = useCallback(async (endpoint: string, data: any): Promise<any> => {
    try {
      console.log(`Making POST request to: ${API_URL}${endpoint}`, data);
      const response: AxiosResponse = await axios.post(`${API_URL}${endpoint}`, data, {
        headers: getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error in POST ${endpoint}:`, error);
      throw error;
    }
  }, [getHeaders]);

  const put = useCallback(async (endpoint: string, data: any): Promise<any> => {
    try {
      console.log(`Making PUT request to: ${API_URL}${endpoint}`, data);
      const response: AxiosResponse = await axios.put(`${API_URL}${endpoint}`, data, {
        headers: getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error in PUT ${endpoint}:`, error);
      throw error;
    }
  }, [getHeaders]);

  const del = useCallback(async (endpoint: string): Promise<any> => {
    try {
      console.log(`Making DELETE request to: ${API_URL}${endpoint}`);
      const response: AxiosResponse = await axios.delete(`${API_URL}${endpoint}`, {
        headers: getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error(`Error in DELETE ${endpoint}:`, error);
      throw error;
    }
  }, [getHeaders]);

  return {
    get,
    post,
    put,
    delete: del,
  };
}; 
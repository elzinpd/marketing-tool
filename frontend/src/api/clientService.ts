import api from './axios';
import { Client } from '../types';

const BASE_URL = '/api/v1/clients';

/**
 * Fetch all clients
 */
export const getClients = async (): Promise<Client[]> => {
  try {
    const response = await api.get(BASE_URL);
    return response.data.map((client: any) => ({
      ...client,
      campaign_keywords: Array.isArray(client.campaign_keywords) 
        ? client.campaign_keywords.join(', ')
        : client.campaign_keywords || '',
      campaign_keywords_list: Array.isArray(client.campaign_keywords)
        ? client.campaign_keywords
        : []
    }));
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

/**
 * Fetch a single client by ID
 */
export const getClientById = async (id: number): Promise<Client> => {
  try {
    const response = await api.get(`${BASE_URL}/${id}`);
    const client = response.data;
    return {
      ...client,
      campaign_keywords: Array.isArray(client.campaign_keywords) 
        ? client.campaign_keywords.join(', ')
        : client.campaign_keywords || '',
      campaign_keywords_list: Array.isArray(client.campaign_keywords)
        ? client.campaign_keywords
        : []
    };
  } catch (error) {
    console.error(`Error fetching client with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Create a new client
 */
export const createClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
  // Convert campaign_keywords from string to array if it's not already
  const formattedData = {
    name: clientData.name,
    campaign_keywords: typeof clientData.campaign_keywords === 'string' 
      ? clientData.campaign_keywords.split(',').map(kw => kw.trim()).filter(Boolean)
      : clientData.campaign_keywords
  };
  
  try {
    const response = await api.post(BASE_URL, formattedData);
    return {
      ...response.data,
      campaign_keywords: Array.isArray(response.data.campaign_keywords) 
        ? response.data.campaign_keywords.join(', ')
        : response.data.campaign_keywords || '',
      campaign_keywords_list: Array.isArray(response.data.campaign_keywords)
        ? response.data.campaign_keywords
        : []
    };
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

/**
 * Update an existing client
 */
export const updateClient = async (id: number, clientData: Partial<Client>): Promise<Client> => {
  console.log('updateClient called with:', { id, clientData });
  
  // Convert campaign_keywords from string to array if it's not already
  const formattedData = {
    name: clientData.name || '',
    campaign_keywords: typeof clientData.campaign_keywords === 'string' 
      ? clientData.campaign_keywords.split(',').map(kw => kw.trim()).filter(Boolean)
      : (clientData.campaign_keywords_list || [])
  };
  
  console.log('Sending formatted data to API:', formattedData);
  
  try {
    const response = await api.put(`${BASE_URL}/${id}`, formattedData);
    console.log('API response:', response.data);
    
    return {
      ...response.data,
      campaign_keywords: Array.isArray(response.data.campaign_keywords) 
        ? response.data.campaign_keywords.join(', ')
        : response.data.campaign_keywords || '',
      campaign_keywords_list: Array.isArray(response.data.campaign_keywords)
        ? response.data.campaign_keywords
        : []
    };
  } catch (error) {
    console.error(`Error updating client with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (id: number): Promise<void> => {
  try {
    await api.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting client with ID ${id}:`, error);
    throw error;
  }
}; 
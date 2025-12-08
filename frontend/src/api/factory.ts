import apiClient from './client';

export interface Factory {
  id: string;
  owner_id: string;
  name: string;
  location?: string;
  subscription_status: string;
  trial_ends_at?: string;
  plan_expiry_date?: string;
  plan_type?: string;
  created_at: string;
}

export interface FactoryCreate {
  name: string;
  location?: string;
}

export const factoryApi = {
  getAll: async (): Promise<Factory[]> => {
    const response = await apiClient.get('/factories');
    return response.data;
  },

  getById: async (id: string): Promise<Factory> => {
    const response = await apiClient.get(`/factories/${id}`);
    return response.data;
  },

  create: async (data: FactoryCreate): Promise<Factory> => {
    const response = await apiClient.post('/factories', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Factory>): Promise<Factory> => {
    const response = await apiClient.put(`/factories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/factories/${id}`);
  },
};
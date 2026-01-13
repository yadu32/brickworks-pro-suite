import apiClient from './client';

export interface Customer {
  id: string;
  factory_id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at?: string;
}

export interface CustomerCreate {
  factory_id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export const customerApi = {
  getByFactory: async (factoryId: string): Promise<Customer[]> => {
    const response = await apiClient.get(`/customers/factory/${factoryId}`);
    return response.data;
  },

  create: async (data: CustomerCreate): Promise<Customer> => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};
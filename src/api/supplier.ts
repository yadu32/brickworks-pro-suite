import apiClient from './client';

export interface Supplier {
  id: string;
  factory_id: string;
  name: string;
  contact_number?: string;
  address?: string;
  material_type?: string;
  created_at?: string;
}

export interface SupplierCreate {
  factory_id: string;
  name: string;
  contact_number?: string;
  address?: string;
  material_type?: string;
}

export const supplierApi = {
  getByFactory: async (factoryId: string): Promise<Supplier[]> => {
    const response = await apiClient.get(`/suppliers/factory/${factoryId}`);
    return response.data;
  },

  create: async (data: SupplierCreate): Promise<Supplier> => {
    const response = await apiClient.post('/suppliers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const response = await apiClient.put(`/suppliers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
  },
};
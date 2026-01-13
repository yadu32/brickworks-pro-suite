import apiClient from './client';

export interface ProductDefinition {
  id: string;
  factory_id: string;
  name: string;
  items_per_punch?: number;
  size_description?: string;
  unit: string;
  created_at: string;
}

export interface ProductCreate {
  factory_id: string;
  name: string;
  items_per_punch?: number;
  size_description?: string;
  unit?: string;
}

export const productApi = {
  getByFactory: async (factoryId: string): Promise<ProductDefinition[]> => {
    const response = await apiClient.get(`/products/factory/${factoryId}`);
    return response.data;
  },

  getById: async (id: string): Promise<ProductDefinition> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: ProductCreate): Promise<ProductDefinition> => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ProductDefinition>): Promise<ProductDefinition> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};
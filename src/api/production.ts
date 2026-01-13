import apiClient from './client';

export interface ProductionLog {
  id: string;
  factory_id: string;
  date?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  punches?: number;
  remarks?: string;
  created_at: string;
}

export interface ProductionCreate {
  factory_id: string;
  date?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  punches?: number;
  remarks?: string;
}

export const productionApi = {
  getByFactory: async (factoryId: string, startDate?: string, endDate?: string): Promise<ProductionLog[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await apiClient.get(`/production/factory/${factoryId}?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<ProductionLog> => {
    const response = await apiClient.get(`/production/${id}`);
    return response.data;
  },

  create: async (data: ProductionCreate): Promise<ProductionLog> => {
    const response = await apiClient.post('/production', data);
    return response.data;
  },

  update: async (id: string, data: Partial<ProductionLog>): Promise<ProductionLog> => {
    const response = await apiClient.put(`/production/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/production/${id}`);
  },
};
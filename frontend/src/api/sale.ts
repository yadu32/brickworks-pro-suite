import apiClient from './client';

export interface Sale {
  id: string;
  factory_id?: string;
  date: string;
  customer_name: string;
  customer_phone?: string;
  product_id: string;
  quantity_sold: number;
  rate_per_brick: number;
  total_amount: number;
  amount_received: number;
  balance_due: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleCreate {
  factory_id: string;
  date: string;
  customer_name: string;
  customer_phone?: string;
  product_id: string;
  quantity_sold: number;
  rate_per_brick: number;
  total_amount: number;
  amount_received?: number;
  balance_due?: number;
  notes?: string;
}

export const saleApi = {
  getByFactory: async (factoryId: string, startDate?: string, endDate?: string): Promise<Sale[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await apiClient.get(`/sales/factory/${factoryId}?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Sale> => {
    const response = await apiClient.get(`/sales/${id}`);
    return response.data;
  },

  create: async (data: SaleCreate): Promise<Sale> => {
    const response = await apiClient.post('/sales', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Sale>): Promise<Sale> => {
    const response = await apiClient.put(`/sales/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sales/${id}`);
  },
};
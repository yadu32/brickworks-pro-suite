import apiClient from './client';

export interface Material {
  id: string;
  factory_id?: string;
  material_name: string;
  unit: string;
  current_stock_qty: number;
  average_cost_per_unit: number;
  created_at: string;
  updated_at: string;
}

export interface MaterialCreate {
  factory_id: string;
  material_name: string;
  unit: string;
  current_stock_qty?: number;
  average_cost_per_unit?: number;
}

export interface MaterialPurchase {
  id: string;
  factory_id?: string;
  date: string;
  material_id: string;
  quantity_purchased: number;
  unit_cost: number;
  supplier_name: string;
  supplier_phone?: string;
  payment_made: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialPurchaseCreate {
  factory_id: string;
  date: string;
  material_id: string;
  quantity_purchased: number;
  unit_cost: number;
  supplier_name: string;
  supplier_phone?: string;
  payment_made?: number;
  notes?: string;
}

export interface MaterialUsage {
  id: string;
  factory_id?: string;
  date: string;
  material_id: string;
  quantity_used: number;
  purpose: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialUsageCreate {
  factory_id: string;
  date: string;
  material_id: string;
  quantity_used: number;
  purpose: string;
}

export const materialApi = {
  getByFactory: async (factoryId: string): Promise<Material[]> => {
    const response = await apiClient.get(`/materials/factory/${factoryId}`);
    return response.data;
  },

  create: async (data: MaterialCreate): Promise<Material> => {
    const response = await apiClient.post('/materials', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Material>): Promise<Material> => {
    const response = await apiClient.put(`/materials/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/materials/${id}`);
  },

  // Material Purchases
  getPurchases: async (factoryId: string, startDate?: string, endDate?: string): Promise<MaterialPurchase[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await apiClient.get(`/material-purchases/factory/${factoryId}?${params.toString()}`);
    return response.data;
  },

  createPurchase: async (data: MaterialPurchaseCreate): Promise<MaterialPurchase> => {
    const response = await apiClient.post('/material-purchases', data);
    return response.data;
  },

  deletePurchase: async (id: string): Promise<void> => {
    await apiClient.delete(`/material-purchases/${id}`);
  },

  // Material Usage
  getUsage: async (factoryId: string, startDate?: string, endDate?: string): Promise<MaterialUsage[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await apiClient.get(`/material-usage/factory/${factoryId}?${params.toString()}`);
    return response.data;
  },

  createUsage: async (data: MaterialUsageCreate): Promise<MaterialUsage> => {
    const response = await apiClient.post('/material-usage', data);
    return response.data;
  },

  deleteUsage: async (id: string): Promise<void> => {
    await apiClient.delete(`/material-usage/${id}`);
  },
};
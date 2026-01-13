import apiClient from './client';

export interface FactoryRate {
  id: string;
  factory_id?: string;
  rate_type: string;
  rate_amount: number;
  effective_date: string;
  is_active: boolean;
  brick_type_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FactoryRateCreate {
  factory_id: string;
  rate_type: string;
  rate_amount: number;
  effective_date?: string;
  is_active?: boolean;
  brick_type_id?: string;
}

export interface OtherExpense {
  id: string;
  factory_id?: string;
  date: string;
  expense_type: string;
  description: string;
  amount: number;
  vendor_name?: string;
  receipt_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OtherExpenseCreate {
  factory_id: string;
  date: string;
  expense_type: string;
  description: string;
  amount: number;
  vendor_name?: string;
  receipt_number?: string;
  notes?: string;
}

export const expenseApi = {
  // Factory Rates
  getRates: async (factoryId: string): Promise<FactoryRate[]> => {
    const response = await apiClient.get(`/factory-rates/factory/${factoryId}`);
    return response.data;
  },

  createRate: async (data: FactoryRateCreate): Promise<FactoryRate> => {
    const response = await apiClient.post('/factory-rates', data);
    return response.data;
  },

  updateRate: async (id: string, data: Partial<FactoryRate>): Promise<FactoryRate> => {
    const response = await apiClient.put(`/factory-rates/${id}`, data);
    return response.data;
  },

  deleteRate: async (id: string): Promise<void> => {
    await apiClient.delete(`/factory-rates/${id}`);
  },

  // Other Expenses
  getOtherExpenses: async (factoryId: string, startDate?: string, endDate?: string): Promise<OtherExpense[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await apiClient.get(`/other-expenses/factory/${factoryId}?${params.toString()}`);
    return response.data;
  },

  createOtherExpense: async (data: OtherExpenseCreate): Promise<OtherExpense> => {
    const response = await apiClient.post('/other-expenses', data);
    return response.data;
  },

  updateOtherExpense: async (id: string, data: Partial<OtherExpense>): Promise<OtherExpense> => {
    const response = await apiClient.put(`/other-expenses/${id}`, data);
    return response.data;
  },

  deleteOtherExpense: async (id: string): Promise<void> => {
    await apiClient.delete(`/other-expenses/${id}`);
  },
};
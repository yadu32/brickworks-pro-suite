import apiClient from './client';

export interface Employee {
  id: string;
  factory_id: string;
  name: string;
  phone?: string;
  role?: string;
  daily_wage?: number;
  is_active: boolean;
  created_at?: string;
}

export interface EmployeeCreate {
  factory_id: string;
  name: string;
  phone?: string;
  role?: string;
  daily_wage?: number;
  is_active?: boolean;
}

export interface EmployeePayment {
  id: string;
  factory_id?: string;
  date: string;
  employee_name: string;
  amount: number;
  payment_type: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeePaymentCreate {
  factory_id: string;
  date: string;
  employee_name: string;
  amount: number;
  payment_type: string;
  notes?: string;
}

export const employeeApi = {
  getByFactory: async (factoryId: string): Promise<Employee[]> => {
    const response = await apiClient.get(`/employees/factory/${factoryId}`);
    return response.data;
  },

  create: async (data: EmployeeCreate): Promise<Employee> => {
    const response = await apiClient.post('/employees', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.put(`/employees/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },

  // Employee Payments
  getPayments: async (factoryId: string, startDate?: string, endDate?: string): Promise<EmployeePayment[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await apiClient.get(`/employee-payments/factory/${factoryId}?${params.toString()}`);
    return response.data;
  },

  createPayment: async (data: EmployeePaymentCreate): Promise<EmployeePayment> => {
    const response = await apiClient.post('/employee-payments', data);
    return response.data;
  },

  deletePayment: async (id: string): Promise<void> => {
    await apiClient.delete(`/employee-payments/${id}`);
  },
};
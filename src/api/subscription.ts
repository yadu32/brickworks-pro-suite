import apiClient from './client';

export interface SubscriptionStatus {
  subscription_status: string;
  trial_ends_at: string | null;
  plan_expiry_date: string | null;
  plan_type: string | null;
  days_remaining: number;
  is_trial_expired: boolean;
  is_active: boolean;
  can_perform_action: boolean;
}

export interface CreateOrderRequest {
  amount_in_paise: number;
  plan_id: string;
}

export interface CreateOrderResponse {
  order_id: string;
  razorpay_key: string;
  amount: number;
  currency: string;
}

export interface CompletePaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  plan_id: string;
}

export const subscriptionApi = {
  getStatus: async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.get<SubscriptionStatus>('/subscription/status');
    return response.data;
  },

  createOrder: async (data: CreateOrderRequest): Promise<CreateOrderResponse> => {
    const response = await apiClient.post<CreateOrderResponse>('/subscription/create-order', data);
    return response.data;
  },

  completePayment: async (data: CompletePaymentRequest): Promise<SubscriptionStatus> => {
    const response = await apiClient.post<SubscriptionStatus>('/subscription/complete', data);
    return response.data;
  },

  restore: async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.post<SubscriptionStatus>('/subscription/restore', {});
    return response.data;
  },
};

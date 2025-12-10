import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { subscriptionApi } from '@/api/subscription';
import { useAuth } from './AuthContext';

interface SubscriptionState {
  isLoading: boolean;
  isTrialExpired: boolean;
  isActive: boolean;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  planExpiryDate: Date | null;
  planType: string | null;
  factoryId: string | null;
  daysRemaining: number;
}

interface SubscriptionContextType extends SubscriptionState {
  refreshSubscription: () => Promise<void>;
  canPerformAction: () => boolean;
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isTrialExpired: false,
    isActive: false,
    subscriptionStatus: 'trial',
    trialEndsAt: null,
    planExpiryDate: null,
    planType: null,
    factoryId: null,
    daysRemaining: 0,
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const refreshSubscription = async () => {
    try {
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const data = await subscriptionApi.getStatus();
      
      const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
      const planExpiryDate = data.plan_expiry_date ? new Date(data.plan_expiry_date) : null;

      setState({
        isLoading: false,
        isTrialExpired: data.is_trial_expired,
        isActive: data.is_active,
        subscriptionStatus: data.subscription_status,
        trialEndsAt,
        planExpiryDate,
        planType: data.plan_type,
        factoryId: null, // Not needed with FastAPI
        daysRemaining: data.days_remaining,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const canPerformAction = (): boolean => {
    if (state.isLoading) return true; // Allow during loading
    if (state.isActive) return true;
    if (!state.isTrialExpired) return true;
    return false;
  };

  useEffect(() => {
    if (user) {
      refreshSubscription();
    }
  }, [user]);

  return (
    <SubscriptionContext.Provider 
      value={{ 
        ...state, 
        refreshSubscription, 
        canPerformAction,
        showUpgradeModal,
        setShowUpgradeModal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const calculateDaysRemaining = (endDate: Date | null): number => {
    if (!endDate) return 0;
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const refreshSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { data: factory, error } = await supabase
        .from('factories')
        .select('id, subscription_status, trial_ends_at, plan_expiry_date, plan_type')
        .eq('owner_id', user.id)
        .single();

      if (error || !factory) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const now = new Date();
      const trialEndsAt = factory.trial_ends_at ? new Date(factory.trial_ends_at) : null;
      const planExpiryDate = factory.plan_expiry_date ? new Date(factory.plan_expiry_date) : null;
      
      const isActive = factory.subscription_status === 'active' && 
        planExpiryDate && planExpiryDate > now;
      
      const isTrialExpired = factory.subscription_status === 'trial' && 
        trialEndsAt && trialEndsAt < now;

      // Calculate days remaining based on status
      let daysRemaining = 0;
      if (isActive && planExpiryDate) {
        daysRemaining = calculateDaysRemaining(planExpiryDate);
      } else if (!isTrialExpired && trialEndsAt) {
        daysRemaining = calculateDaysRemaining(trialEndsAt);
      }

      setState({
        isLoading: false,
        isTrialExpired,
        isActive,
        subscriptionStatus: factory.subscription_status,
        trialEndsAt,
        planExpiryDate,
        planType: factory.plan_type,
        factoryId: factory.id,
        daysRemaining,
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
    refreshSubscription();
  }, []);

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

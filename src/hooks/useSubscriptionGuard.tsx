import { useSubscription } from '@/contexts/SubscriptionContext';

export const useSubscriptionGuard = () => {
  const { canPerformAction, setShowUpgradeModal, isTrialExpired, isActive } = useSubscription();

  const guardAction = (action: () => void) => {
    if (canPerformAction()) {
      action();
    } else {
      setShowUpgradeModal(true);
    }
  };

  const isReadOnly = isTrialExpired && !isActive;

  return {
    guardAction,
    isReadOnly,
    showUpgradePrompt: () => setShowUpgradeModal(true),
  };
};

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

const TrialExpiredBanner: React.FC = () => {
  const { isTrialExpired, isActive, setShowUpgradeModal, daysRemaining, subscriptionStatus } = useSubscription();

  // Show trial ending soon warning (last 7 days)
  if (!isActive && !isTrialExpired && daysRemaining <= 7 && daysRemaining > 0) {
    return (
      <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-amber-200 text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span>Trial ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.</span>
          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="underline font-medium hover:text-amber-100 transition-colors"
          >
            Upgrade now
          </button>
        </div>
      </div>
    );
  }

  // Show expired banner
  if (isTrialExpired && !isActive) {
    return (
      <div className="bg-destructive/20 border-b border-destructive/30 px-4 py-3">
        <div className="flex items-center justify-center gap-2 text-destructive-foreground text-sm">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Trial Expired. Read-only mode active.</span>
          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="bg-primary text-primary-foreground px-3 py-1 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Upgrade to Resume
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TrialExpiredBanner;

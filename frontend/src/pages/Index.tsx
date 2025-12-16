import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import ProductionModule from '@/components/ProductionModule';
import MaterialsModule from '@/components/MaterialsModule';
import SalesModule from '@/components/SalesModule';
import ExpensesModule from '@/components/ExpensesModule';
import ReportsModule from '@/components/ReportsModule';
import { SettingsHub } from '@/components/SettingsHub';
import TrialExpiredBanner from '@/components/TrialExpiredBanner';
import UpgradePlanModal from '@/components/UpgradePlanModal';
import SubscriptionPage from '@/pages/SubscriptionPage';
import { useSubscription } from '@/contexts/SubscriptionContext';

const Index = () => {
  const { isTrialExpired, isActive, isLoading } = useSubscription();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [salesFilter, setSalesFilter] = useState<{ showDuesOnly?: boolean }>({});

  // Auto-redirect to subscription page if trial expired and no active subscription
  useEffect(() => {
    if (!isLoading && isTrialExpired && !isActive) {
      setActiveTab('subscription');
    }
  }, [isTrialExpired, isActive, isLoading]);

  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      if (typeof event.detail === 'object' && event.detail.tab) {
        setActiveTab(event.detail.tab);
        if (event.detail.showDuesOnly !== undefined) {
          setSalesFilter({ showDuesOnly: event.detail.showDuesOnly });
        }
      } else {
        setActiveTab(event.detail);
        setSalesFilter({});
      }
    };

    window.addEventListener('changeTab', handleTabChange as EventListener);
    return () => window.removeEventListener('changeTab', handleTabChange as EventListener);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSalesFilter({});
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <TrialExpiredBanner />
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="transition-all duration-300 ease-in-out pb-20 md:pb-0">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'production' && <ProductionModule />}
        {activeTab === 'materials' && <MaterialsModule />}
        {activeTab === 'sales' && <SalesModule initialShowDuesOnly={salesFilter.showDuesOnly} />}
        {activeTab === 'expenses' && <ExpensesModule />}
        {activeTab === 'weekly' && <ReportsModule />}
        {activeTab === 'subscription' && <SubscriptionPage />}
        {activeTab === 'settings' && <SettingsHub />}
      </div>
      <UpgradePlanModal />
    </div>
  );
};

export default Index;

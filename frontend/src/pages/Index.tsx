import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import ProductionModule from '@/components/ProductionModule';
import MaterialsModule from '@/components/MaterialsModule';
import SalesModule from '@/components/SalesModule';
import PaymentsModule from '@/components/PaymentsModule';
import ReportsModule from '@/components/ReportsModule';
import OtherExpensesModule from '@/components/OtherExpensesModule';
import { SettingsHub } from '@/components/SettingsHub';
import TrialExpiredBanner from '@/components/TrialExpiredBanner';
import UpgradePlanModal from '@/components/UpgradePlanModal';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [salesFilter, setSalesFilter] = useState<{ showDuesOnly?: boolean }>({});

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
      <div className="transition-all duration-300 ease-in-out">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'production' && <ProductionModule />}
        {activeTab === 'materials' && <MaterialsModule />}
        {activeTab === 'sales' && <SalesModule initialShowDuesOnly={salesFilter.showDuesOnly} />}
        {activeTab === 'payments' && <PaymentsModule />}
        {activeTab === 'expenses' && <OtherExpensesModule />}
        {activeTab === 'weekly' && <ReportsModule />}
        {activeTab === 'settings' && <SettingsHub />}
      </div>
      <UpgradePlanModal />
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import ProductionModule from '@/components/ProductionModule';
import MaterialsModule from '@/components/MaterialsModule';
import SalesModule from '@/components/SalesModule';
import PaymentsModule from '@/components/PaymentsModule';
import ReportsModule from '@/components/ReportsModule';
import AnalyticsModule from '@/components/AnalyticsModule';
import MaintenanceModule from '@/components/MaintenanceModule';
import TraceabilityModule from '@/components/TraceabilityModule';
import BillingModule from '@/components/BillingModule';
import { FactoryRatesSettings } from '@/components/FactoryRatesSettings';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('changeTab', handleTabChange as EventListener);
    return () => window.removeEventListener('changeTab', handleTabChange as EventListener);
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'production' && <ProductionModule />}
      {activeTab === 'materials' && <MaterialsModule />}
      {activeTab === 'sales' && <SalesModule />}
      {activeTab === 'payments' && <PaymentsModule />}
      {activeTab === 'maintenance' && <MaintenanceModule />}
      {activeTab === 'traceability' && <TraceabilityModule />}
      {activeTab === 'billing' && <BillingModule />}
      {activeTab === 'analytics' && <AnalyticsModule />}
      {activeTab === 'weekly' && <ReportsModule />}
      {activeTab === 'settings' && <FactoryRatesSettings />}
    </div>
  );
};

export default Index;

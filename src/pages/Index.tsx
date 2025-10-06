import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import ProductionModule from '@/components/ProductionModule';
import MaterialsModule from '@/components/MaterialsModule';
import SalesModule from '@/components/SalesModule';
import PaymentsModule from '@/components/PaymentsModule';
import ReportsModule from '@/components/ReportsModule';
import AnalyticsModule from '@/components/AnalyticsModule';
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
      {activeTab === 'maintenance' && <div className="p-6"><h1 className="text-2xl font-bold">Maintenance Module (Coming Soon)</h1><p className="mt-2 text-muted-foreground">Once database migration completes, this will show maintenance tickets and OEE tracking.</p></div>}
      {activeTab === 'traceability' && <div className="p-6"><h1 className="text-2xl font-bold">Traceability Module (Coming Soon)</h1><p className="mt-2 text-muted-foreground">Material genealogy tracking from purchase to sales.</p></div>}
      {activeTab === 'billing' && <div className="p-6"><h1 className="text-2xl font-bold">Billing Module (Coming Soon)</h1><p className="mt-2 text-muted-foreground">Delivery challans and GST invoices.</p></div>}
      {activeTab === 'analytics' && <AnalyticsModule />}
      {activeTab === 'weekly' && <ReportsModule />}
      {activeTab === 'settings' && <FactoryRatesSettings />}
    </div>
  );
};

export default Index;

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import ProductionModule from '@/components/ProductionModule';
import MaterialsModule from '@/components/MaterialsModule';
import SalesModule from '@/components/SalesModule';
import PaymentsModule from '@/components/PaymentsModule';
import ReportsModule from '@/components/ReportsModule';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'production' && <ProductionModule />}
      {activeTab === 'materials' && <MaterialsModule />}
      {activeTab === 'sales' && <SalesModule />}
      {activeTab === 'payments' && <PaymentsModule />}
      {activeTab === 'weekly' && <ReportsModule />}

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'production' && <ProductionModule />}
      {activeTab === 'materials' && <MaterialsModule />}
      {activeTab === 'sales' && <SalesModule />}
      {activeTab === 'payments' && <PaymentsModule />}
      {activeTab === 'weekly' && <ReportsModule />}
    </div>
  );
};

export default Index;

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import ProductionModule from '@/components/ProductionModule';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'production':
        return <ProductionModule />;
      case 'materials':
        return <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-4">Materials Management</h1>
            <p className="text-muted-foreground">Coming soon - Track Cement, Dust, and Diesel inventory</p>
          </div>
        </div>;
      case 'sales':
        return <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-4">Sales Management</h1>
            <p className="text-muted-foreground">Coming soon - Manage customer sales and payments</p>
          </div>
        </div>;
      case 'payments':
        return <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-4">Employee Payments</h1>
            <p className="text-muted-foreground">Coming soon - Track employee salary and advances</p>
          </div>
        </div>;
      case 'weekly':
        return <div className="min-h-screen bg-background p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-4">Weekly Reports</h1>
            <p className="text-muted-foreground">Coming soon - Generate comprehensive weekly reports</p>
          </div>
        </div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      {renderActiveTab()}
    </div>
  );
};

export default Index;

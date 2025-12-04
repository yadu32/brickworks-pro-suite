import { useState, useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Dashboard from '@/components/Dashboard';
import ProductionModule from '@/components/ProductionModule';
import MaterialsModule from '@/components/MaterialsModule';
import SalesModule from '@/components/SalesModule';
import PaymentsModule from '@/components/PaymentsModule';
import ReportsModule from '@/components/ReportsModule';
import OtherExpensesModule from '@/components/OtherExpensesModule';
import { SettingsHub } from '@/components/SettingsHub';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

const tabs = ['dashboard', 'production', 'materials', 'sales', 'payments', 'expenses', 'weekly', 'settings'];

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('changeTab', handleTabChange as EventListener);
    return () => window.removeEventListener('changeTab', handleTabChange as EventListener);
  }, []);

  const handleSwipeLeft = useCallback(() => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  }, [activeTab]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  }, [activeTab]);

  useSwipeNavigation({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 80
  });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="transition-all duration-300 ease-in-out">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'production' && <ProductionModule />}
        {activeTab === 'materials' && <MaterialsModule />}
        {activeTab === 'sales' && <SalesModule />}
        {activeTab === 'payments' && <PaymentsModule />}
        {activeTab === 'expenses' && <OtherExpensesModule />}
        {activeTab === 'weekly' && <ReportsModule />}
        {activeTab === 'settings' && <SettingsHub />}
      </div>
    </div>
  );
};

export default Index;

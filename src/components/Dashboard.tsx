import { useState, useEffect } from 'react';
import { TrendingUp, Package, Users, IndianRupee, AlertTriangle, Factory, ShoppingCart, CreditCard, LucideIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import heroFactory from '@/assets/hero-factory.jpg';
import { QuickEntryDialogs } from '@/components/QuickEntryDialogs';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  action: 'sale' | 'production' | 'usage' | 'payment';
  onClick: () => void;
}

const QuickActionButton = ({ icon: Icon, label, onClick }: QuickActionButtonProps) => {
  return (
    <button onClick={onClick} className="card-dark p-4 text-center hover-scale">
      <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
      <p className="text-sm font-medium text-foreground">{label}</p>
    </button>
  );
};

const Dashboard = () => {
  const [quickEntryType, setQuickEntryType] = useState<'sale' | 'production' | 'usage' | 'payment' | null>(null);
  const [dashboardData, setDashboardData] = useState({
    todayProduction: { fourInch: 0, sixInch: 0 },
    monthlyProduction: { fourInch: 0, sixInch: 0 },
    currentStock: { fourInch: 0, sixInch: 0 },
    salesMetrics: { todayRevenue: 0, monthlyRevenue: 0, outstandingReceivables: 0 },
    materialStock: {
      cement: { quantity: 0, unit: 'bags', value: 0 },
      dust: { quantity: 0, unit: 'tons', value: 0 },
      diesel: { quantity: 0, unit: 'liters', value: 0 },
    },
    recentPayments: { todayTotal: 0, weeklyTotal: 0 },
  });

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get brick types
      const { data: brickTypes } = await supabase.from('brick_types').select('*');
      const fourInchType = brickTypes?.find(bt => bt.type_name.includes('4-inch'));
      const sixInchType = brickTypes?.find(bt => bt.type_name.includes('6-inch'));

      // Today's production
      const { data: todayProd } = await supabase
        .from('bricks_production')
        .select('*, brick_types(*)')
        .eq('date', today);

      const todayFourInch = todayProd?.filter(p => p.brick_type_id === fourInchType?.id).reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0;
      const todaySixInch = todayProd?.filter(p => p.brick_type_id === sixInchType?.id).reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0;

      // Monthly production
      const { data: monthlyProd } = await supabase
        .from('bricks_production')
        .select('*, brick_types(*)')
        .gte('date', startOfMonth);

      const monthlyFourInch = monthlyProd?.filter(p => p.brick_type_id === fourInchType?.id).reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0;
      const monthlySixInch = monthlyProd?.filter(p => p.brick_type_id === sixInchType?.id).reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0;

      // Total production for stock calculation
      const { data: allProd } = await supabase.from('bricks_production').select('*, brick_types(*)');
      const totalFourInchProd = allProd?.filter(p => p.brick_type_id === fourInchType?.id).reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0;
      const totalSixInchProd = allProd?.filter(p => p.brick_type_id === sixInchType?.id).reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0;

      // Total sales for stock calculation
      const { data: allSales } = await supabase.from('sales').select('*, brick_types(*)');
      const totalFourInchSold = allSales?.filter(s => s.brick_type_id === fourInchType?.id).reduce((sum, s) => sum + s.quantity_sold, 0) || 0;
      const totalSixInchSold = allSales?.filter(s => s.brick_type_id === sixInchType?.id).reduce((sum, s) => sum + s.quantity_sold, 0) || 0;

      // Sales metrics
      const { data: todaySales } = await supabase.from('sales').select('*').eq('date', today);
      const { data: monthlySales } = await supabase.from('sales').select('*').gte('date', startOfMonth);
      const { data: allSalesForBalance } = await supabase.from('sales').select('*');

      const todayRevenue = todaySales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
      const monthlyRevenue = monthlySales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
      const outstandingReceivables = allSalesForBalance?.reduce((sum, s) => sum + s.balance_due, 0) || 0;

      // Materials
      const { data: materials } = await supabase.from('materials').select('*');

      // Employee payments
      const { data: todayPayments } = await supabase.from('employee_payments').select('*').eq('date', today);
      const { data: weeklyPayments } = await supabase.from('employee_payments').select('*').gte('date', weekAgo);

      const todayTotal = todayPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const weeklyTotal = weeklyPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

      setDashboardData({
        todayProduction: { fourInch: todayFourInch, sixInch: todaySixInch },
        monthlyProduction: { fourInch: monthlyFourInch, sixInch: monthlySixInch },
        currentStock: { 
          fourInch: totalFourInchProd - totalFourInchSold, 
          sixInch: totalSixInchProd - totalSixInchSold 
        },
        salesMetrics: { todayRevenue, monthlyRevenue, outstandingReceivables },
        materialStock: {
          cement: { 
            quantity: materials?.find(m => m.material_name === 'Cement')?.current_stock_qty || 0, 
            unit: 'bags', 
            value: (materials?.find(m => m.material_name === 'Cement')?.current_stock_qty || 0) * (materials?.find(m => m.material_name === 'Cement')?.average_cost_per_unit || 0)
          },
          dust: { 
            quantity: materials?.find(m => m.material_name === 'Dust')?.current_stock_qty || 0, 
            unit: 'tons', 
            value: (materials?.find(m => m.material_name === 'Dust')?.current_stock_qty || 0) * (materials?.find(m => m.material_name === 'Dust')?.average_cost_per_unit || 0)
          },
          diesel: { 
            quantity: materials?.find(m => m.material_name === 'Diesel')?.current_stock_qty || 0, 
            unit: 'liters', 
            value: (materials?.find(m => m.material_name === 'Diesel')?.current_stock_qty || 0) * (materials?.find(m => m.material_name === 'Diesel')?.average_cost_per_unit || 0)
          },
        },
        recentPayments: { todayTotal, weeklyTotal },
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${heroFactory})` }}
      >
        <div className="absolute inset-0 bg-background/80"></div>
        <div className="relative text-center z-10">
          <h1 className="text-4xl font-bold text-foreground mb-2">BrickWorks Manager</h1>
          <p className="text-lg text-muted-foreground">Professional Brick Manufacturing Management System</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Production & Inventory */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Production & Inventory</h2>
          <div className="card-metric">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-secondary">Monthly 4-inch</p>
                <p className="text-2xl font-bold text-foreground">{dashboardData.monthlyProduction.fourInch.toLocaleString()}</p>
              </div>
              
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-secondary">Monthly 6-inch</p>
                <p className="text-2xl font-bold text-foreground">{dashboardData.monthlyProduction.sixInch.toLocaleString()}</p>
              </div>
              
              <div className="text-center">
                <Package className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-secondary">4-inch Stock</p>
                <p className="text-2xl font-bold text-foreground">{dashboardData.currentStock.fourInch.toLocaleString()}</p>
              </div>
              
              <div className="text-center">
                <Package className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-secondary">6-inch Stock</p>
                <p className="text-2xl font-bold text-foreground">{dashboardData.currentStock.sixInch.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sales Summary */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sales Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Monthly Total Sales</p>
                  <p className="text-metric text-success">{formatCurrency(dashboardData.salesMetrics.monthlyRevenue)}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-success" />
              </div>
            </div>
            
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Outstanding</p>
                  <p className="text-metric text-warning">{formatCurrency(dashboardData.salesMetrics.outstandingReceivables)}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-warning" />
              </div>
            </div>
          </div>
        </section>

        {/* Material Stock Values */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Material Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-metric">
              <div className="text-center">
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-secondary">Cement</p>
                <p className="text-xl font-bold text-foreground">{dashboardData.materialStock.cement.quantity} {dashboardData.materialStock.cement.unit}</p>
                <p className="text-secondary">{formatCurrency(dashboardData.materialStock.cement.value)}</p>
              </div>
            </div>
            
            <div className="card-metric">
              <div className="text-center">
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-secondary">Dust</p>
                <p className="text-xl font-bold text-foreground">{dashboardData.materialStock.dust.quantity} {dashboardData.materialStock.dust.unit}</p>
                <p className="text-secondary">{formatCurrency(dashboardData.materialStock.dust.value)}</p>
              </div>
            </div>
            
            <div className="card-metric">
              <div className="text-center">
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-secondary">Diesel</p>
                <p className="text-xl font-bold text-foreground">{dashboardData.materialStock.diesel.quantity} {dashboardData.materialStock.diesel.unit}</p>
                <p className="text-secondary">{formatCurrency(dashboardData.materialStock.diesel.value)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Employee Payments Summary */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Employee Payments</h2>
          <div className="grid grid-cols-1 gap-6">
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Weekly Payments</p>
                  <p className="text-metric text-warning">{formatCurrency(dashboardData.recentPayments.weeklyTotal)}</p>
                </div>
                <Users className="h-12 w-12 text-warning" />
              </div>
            </div>
          </div>
        </section>

        {/* New Entry */}
        <section className="animate-scale-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">New Entry</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton icon={Factory} label="Production" action="production" onClick={() => setQuickEntryType('production')} />
            <QuickActionButton icon={ShoppingCart} label="Sale" action="sale" onClick={() => setQuickEntryType('sale')} />
            <QuickActionButton icon={Package} label="Material" action="usage" onClick={() => setQuickEntryType('usage')} />
            <QuickActionButton icon={CreditCard} label="Payment" action="payment" onClick={() => setQuickEntryType('payment')} />
          </div>
        </section>
      </div>

      <QuickEntryDialogs
        type={quickEntryType}
        onClose={() => setQuickEntryType(null)}
        onSuccess={() => loadDashboardData()}
      />
    </div>
  );
};

export default Dashboard;
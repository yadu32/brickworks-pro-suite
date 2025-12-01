import { useState, useEffect } from 'react';
import { TrendingUp, Package, Users, AlertTriangle, Factory, ShoppingCart, CreditCard, LucideIcon, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import heroFactory from '@/assets/hero-factory.jpg';
import { QuickEntryDialogs } from '@/components/QuickEntryDialogs';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  action: 'sale' | 'production' | 'usage' | 'payment';
  onClick: () => void;
}

interface BrickType {
  id: string;
  type_name: string;
  standard_bricks_per_punch: number;
}

interface Material {
  id: string;
  material_name: string;
  unit: string;
  current_stock_qty: number;
  average_cost_per_unit: number;
}

interface BrickStock {
  id: string;
  name: string;
  stock: number;
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
  const [brickStocks, setBrickStocks] = useState<BrickStock[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [salesMetrics, setSalesMetrics] = useState({
    monthlyRevenue: 0,
    outstandingReceivables: 0
  });
  const [weeklyPayments, setWeeklyPayments] = useState(0);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get all brick types dynamically
      const { data: brickTypes } = await supabase.from('brick_types').select('*').eq('is_active', true);

      // Get all production
      const { data: allProd } = await supabase.from('bricks_production').select('*');

      // Get all sales
      const { data: allSales } = await supabase.from('sales').select('*');

      // Calculate stock for each brick type
      const stocks: BrickStock[] = (brickTypes || []).map(bt => {
        const produced = allProd?.filter(p => p.brick_type_id === bt.id).reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0;
        const sold = allSales?.filter(s => s.product_id === bt.id).reduce((sum, s) => sum + s.quantity_sold, 0) || 0;
        return {
          id: bt.id,
          name: bt.type_name,
          stock: produced - sold
        };
      });
      setBrickStocks(stocks);

      // Sales metrics
      const { data: monthlySales } = await supabase.from('sales').select('*').gte('date', startOfMonth);
      const monthlyRevenue = monthlySales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
      const outstandingReceivables = allSales?.reduce((sum, s) => sum + s.balance_due, 0) || 0;
      setSalesMetrics({ monthlyRevenue, outstandingReceivables });

      // Materials - load all dynamically
      const { data: materialsData } = await supabase.from('materials').select('*');
      setMaterials(materialsData || []);

      // Employee payments
      const { data: weeklyPaymentsData } = await supabase.from('employee_payments').select('*').gte('date', weekAgo);
      const weeklyTotal = weeklyPaymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      setWeeklyPayments(weeklyTotal);
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
        {/* Settings Button - Top Left */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('changeTab', { detail: 'settings' }))}
          className="absolute top-4 left-4 z-20 p-3 bg-card/90 backdrop-blur-sm rounded-full hover:bg-primary transition-colors"
        >
          <Settings className="h-6 w-6 text-foreground hover:text-primary-foreground" />
        </button>
        <div className="relative text-center z-10">
          <h1 className="text-4xl font-bold text-foreground mb-2">BrickWorks Manager</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Sales Summary */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sales Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Monthly Total Sales</p>
                  <p className="text-metric text-success">{formatCurrency(salesMetrics.monthlyRevenue)}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-success" />
              </div>
            </div>
            
            <div 
              className="card-metric cursor-pointer hover:ring-2 hover:ring-warning transition-all"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('changeTab', { detail: 'sales' }));
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Outstanding (Click to view)</p>
                  <p className="text-metric text-warning">{formatCurrency(salesMetrics.outstandingReceivables)}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-warning" />
              </div>
            </div>
          </div>
        </section>

        {/* Production & Inventory - Dynamic Brick Types */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Production & Inventory</h2>
          <div className="card-metric">
            <div className={`grid gap-6 ${brickStocks.length > 2 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
              {brickStocks.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-4">
                  No brick types defined. Add brick types in Settings.
                </div>
              ) : (
                brickStocks.map((brick) => (
                  <div key={brick.id} className="text-center">
                    <Package className="h-8 w-8 text-warning mx-auto mb-2" />
                    <p className="text-secondary">{brick.name}</p>
                    <p className="text-2xl font-bold text-foreground">{brick.stock.toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Material Stock Values - Dynamic Materials */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Material Inventory</h2>
          <div className={`grid gap-6 ${materials.length > 3 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {materials.length === 0 ? (
              <div className="col-span-full card-metric text-center text-muted-foreground py-4">
                No materials defined. Add materials in Settings.
              </div>
            ) : (
              materials.map((material) => (
                <div key={material.id} className="card-metric">
                  <div className="text-center">
                    <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-secondary">{material.material_name}</p>
                    <p className="text-xl font-bold text-foreground">
                      {material.current_stock_qty} {material.unit}
                    </p>
                    <p className="text-secondary">
                      {formatCurrency(material.current_stock_qty * material.average_cost_per_unit)}
                    </p>
                  </div>
                </div>
              ))
            )}
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
                  <p className="text-metric text-warning">{formatCurrency(weeklyPayments)}</p>
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

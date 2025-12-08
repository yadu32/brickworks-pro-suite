import { useState, useEffect } from 'react';
import { TrendingUp, Package, Users, AlertTriangle, Factory, ShoppingCart, CreditCard, LucideIcon, Lock } from 'lucide-react';
import { QuickEntryDialogs } from '@/components/QuickEntryDialogs';
import { useAuth } from '@/contexts/AuthContext';
import { factoryApi, productApi, productionApi, saleApi, materialApi, employeeApi } from '@/api';

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  action: 'sale' | 'production' | 'usage' | 'payment';
  onClick: () => void;
  disabled?: boolean;
}

interface ProductDefinition {
  id: string;
  name: string;
  items_per_punch: number | null;
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

const QuickActionButton = ({ icon: Icon, label, onClick, disabled }: QuickActionButtonProps) => {
  return (
    <button 
      onClick={onClick} 
      className={`card-dark p-4 text-center hover-scale relative ${disabled ? 'opacity-60' : ''}`}
      disabled={disabled}
    >
      {disabled && (
        <div className="absolute top-2 right-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
      <p className="text-sm font-medium text-foreground">{label}</p>
    </button>
  );
};

const Dashboard = () => {
  const [quickEntryType, setQuickEntryType] = useState<'sale' | 'production' | 'usage' | 'payment' | null>(null);
  const [brickStocks, setBrickStocks] = useState<BrickStock[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [salesMetrics, setSalesMetrics] = useState({
    monthlyRevenue: 0,
    outstandingReceivables: 0
  });
  const [weeklyPayments, setWeeklyPayments] = useState(0);

  const { isTrialExpired, isActive, setShowUpgradeModal, canPerformAction } = useSubscription();
  const isReadOnly = isTrialExpired && !isActive;

  const handleQuickAction = (action: 'sale' | 'production' | 'usage' | 'payment') => {
    if (canPerformAction()) {
      setQuickEntryType(action);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const loadFactory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('factories')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (data) {
      setFactoryId(data.id);
    }
  };

  const loadDashboardData = async () => {
    if (!factoryId) return;
    
    try {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get all product definitions (brick types) for this factory
      const { data: products } = await supabase
        .from('product_definitions')
        .select('*')
        .eq('factory_id', factoryId);

      // Get all production for this factory
      const { data: allProd } = await supabase
        .from('production_logs')
        .select('*')
        .eq('factory_id', factoryId);

      // Get all sales for this factory
      const { data: allSales } = await supabase
        .from('sales')
        .select('*')
        .eq('factory_id', factoryId);

      // Calculate stock for each product type
      const stocks: BrickStock[] = (products || []).map(p => {
        const produced = allProd?.filter(prod => prod.product_id === p.id).reduce((sum, prod) => sum + prod.quantity, 0) || 0;
        const sold = allSales?.filter(s => s.product_id === p.id).reduce((sum, s) => sum + s.quantity_sold, 0) || 0;
        return {
          id: p.id,
          name: p.name,
          stock: produced - sold
        };
      });
      setBrickStocks(stocks);

      // Sales metrics
      const { data: monthlySales } = await supabase
        .from('sales')
        .select('*')
        .eq('factory_id', factoryId)
        .gte('date', startOfMonth);
      const monthlyRevenue = monthlySales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
      const outstandingReceivables = allSales?.reduce((sum, s) => sum + s.balance_due, 0) || 0;
      setSalesMetrics({ monthlyRevenue, outstandingReceivables });

      // Materials - load all for this factory
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*')
        .eq('factory_id', factoryId);
      setMaterials(materialsData || []);

      // Employee payments
      const { data: weeklyPaymentsData } = await supabase
        .from('employee_payments')
        .select('*')
        .eq('factory_id', factoryId)
        .gte('date', weekAgo);
      const weeklyTotal = weeklyPaymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0;
      setWeeklyPayments(weeklyTotal);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  useEffect(() => {
    loadFactory();
  }, []);

  useEffect(() => {
    if (factoryId) {
      loadDashboardData();
    }
  }, [factoryId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleOutstandingClick = () => {
    window.dispatchEvent(new CustomEvent('changeTab', { 
      detail: { tab: 'sales', showDuesOnly: true } 
    }));
  };

  // Calculate total material value
  const totalMaterialValue = materials.reduce((sum, m) => sum + (m.current_stock_qty * m.average_cost_per_unit), 0);

  return (
    <div className="min-h-screen bg-background">
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
              onClick={handleOutstandingClick}
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

        {/* Production Overview - Consolidated */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Production Overview</h2>
          <div className="card-metric">
            {brickStocks.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No brick types defined. Add brick types in Settings.
              </div>
            ) : (
              <div className={`grid gap-6 ${brickStocks.length > 2 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
                {brickStocks.map((brick) => (
                  <div key={brick.id} className="text-center">
                    <Package className="h-8 w-8 text-warning mx-auto mb-2" />
                    <p className="text-secondary">{brick.name}</p>
                    <p className="text-2xl font-bold text-foreground">{brick.stock.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">In Stock</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Material Stock Overview - Consolidated */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Material Stock Overview</h2>
          <div className="card-metric">
            {materials.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No materials defined. Add materials in Settings.
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${materials.length > 3 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                  {materials.map((material) => (
                    <div key={material.id} className="text-center">
                      <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-secondary">{material.material_name}</p>
                      <p className="text-xl font-bold text-foreground">
                        {material.current_stock_qty} {material.unit}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border text-center">
                  <p className="text-secondary">Total Stock Value</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(totalMaterialValue)}</p>
                </div>
              </>
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
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            New Entry
            {isReadOnly && <span className="text-sm font-normal text-muted-foreground ml-2">(Upgrade to unlock)</span>}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickActionButton 
              icon={Factory} 
              label="Production" 
              action="production" 
              onClick={() => handleQuickAction('production')} 
              disabled={isReadOnly}
            />
            <QuickActionButton 
              icon={ShoppingCart} 
              label="Sale" 
              action="sale" 
              onClick={() => handleQuickAction('sale')} 
              disabled={isReadOnly}
            />
            <QuickActionButton 
              icon={Package} 
              label="Material" 
              action="usage" 
              onClick={() => handleQuickAction('usage')} 
              disabled={isReadOnly}
            />
            <QuickActionButton 
              icon={CreditCard} 
              label="Payment" 
              action="payment" 
              onClick={() => handleQuickAction('payment')} 
              disabled={isReadOnly}
            />
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

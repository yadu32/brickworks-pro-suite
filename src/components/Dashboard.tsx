import { useState, useEffect } from 'react';
import { ShoppingCart, Factory, IndianRupee, Menu, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuickEntryDialogs } from '@/components/QuickEntryDialogs';
import { useNavigate } from 'react-router-dom';


const Dashboard = () => {
  const navigate = useNavigate();
  const [quickEntryType, setQuickEntryType] = useState<'sale' | 'production' | 'usage' | 'payment' | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalOutstanding: 0,
    weeklyRevenue: 0,
    lowStockMaterials: [] as { name: string; quantity: number; unit: string }[],
  });

  const loadDashboardData = async () => {
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get total outstanding dues
      const { data: allSales } = await supabase.from('sales').select('balance_due');
      const totalOutstanding = allSales?.reduce((sum, s) => sum + s.balance_due, 0) || 0;

      // Get weekly revenue (last 7 days)
      const { data: weeklySales } = await supabase.from('sales').select('total_amount').gte('date', weekAgo);
      const weeklyRevenue = weeklySales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;

      // Get low stock materials (quantity = 0)
      const { data: materials } = await supabase.from('materials').select('*');
      const lowStockMaterials = materials?.filter(m => m.current_stock_qty === 0).map(m => ({
        name: m.material_name,
        quantity: m.current_stock_qty,
        unit: m.unit
      })) || [];

      setDashboardData({
        totalOutstanding,
        weeklyRevenue,
        lowStockMaterials,
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
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Hero Card: Total Outstanding Dues */}
        <div 
          onClick={() => navigate('/sales')}
          className="bg-destructive/70 p-8 rounded-lg shadow-elegant cursor-pointer hover:scale-[1.02] transition-transform duration-200 animate-fade-in"
        >
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-destructive-foreground mx-auto mb-4" />
            <p className="text-destructive-foreground text-lg mb-2">Total Outstanding Dues</p>
            <p className="text-5xl md:text-6xl font-bold text-destructive-foreground">{formatCurrency(dashboardData.totalOutstanding)}</p>
            <p className="text-destructive-foreground/80 text-sm mt-2">Tap to view customers with dues</p>
          </div>
        </div>

        {/* Secondary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sales This Week */}
          <div className="bg-success/70 p-6 rounded-lg shadow-card animate-slide-up">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-success-foreground mx-auto mb-3" />
              <p className="text-success-foreground text-base mb-2">Sales (This Week)</p>
              <p className="text-3xl font-bold text-success-foreground">{formatCurrency(dashboardData.weeklyRevenue)}</p>
            </div>
          </div>

          {/* Low Stock Alert - Conditional */}
          {dashboardData.lowStockMaterials.length > 0 && (
            <div className="bg-warning/70 p-6 rounded-lg shadow-card animate-slide-up">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-warning-foreground mx-auto mb-3" />
                <p className="text-warning-foreground text-base mb-2">Low Stock Alert</p>
                {dashboardData.lowStockMaterials.map((material, idx) => (
                  <p key={idx} className="text-2xl font-bold text-warning-foreground">
                    {material.name}: {material.quantity} {material.unit}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-elegant z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setQuickEntryType('sale')}
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <ShoppingCart className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs text-foreground font-medium">New Sale</span>
            </button>

            <button
              onClick={() => setQuickEntryType('production')}
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Factory className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs text-foreground font-medium">Production</span>
            </button>

            <button
              onClick={() => setQuickEntryType('payment')}
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <IndianRupee className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs text-foreground font-medium">Payment</span>
            </button>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Menu className="h-6 w-6 text-primary mb-1" />
              <span className="text-xs text-foreground font-medium">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-background/95 z-50 p-6 animate-fade-in">
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Menu</h2>
              <button onClick={() => setShowMenu(false)} className="text-foreground">✕</button>
            </div>
            <nav className="space-y-2">
              <button onClick={() => { navigate('/'); setShowMenu(false); }} className="w-full text-left p-4 rounded-lg hover:bg-muted text-foreground">Dashboard</button>
              <button onClick={() => { navigate('/production'); setShowMenu(false); }} className="w-full text-left p-4 rounded-lg hover:bg-muted text-foreground">Production</button>
              <button onClick={() => { navigate('/materials'); setShowMenu(false); }} className="w-full text-left p-4 rounded-lg hover:bg-muted text-foreground">Materials</button>
              <button onClick={() => { navigate('/sales'); setShowMenu(false); }} className="w-full text-left p-4 rounded-lg hover:bg-muted text-foreground">Sales</button>
              <button onClick={() => { navigate('/payments'); setShowMenu(false); }} className="w-full text-left p-4 rounded-lg hover:bg-muted text-foreground">Payments</button>
              <button onClick={() => { navigate('/other-expenses'); setShowMenu(false); }} className="w-full text-left p-4 rounded-lg hover:bg-muted text-foreground">Other Expenses</button>
              <button onClick={() => { navigate('/reports'); setShowMenu(false); }} className="w-full text-left p-4 rounded-lg hover:bg-muted text-foreground">Reports</button>
              <button onClick={() => { navigate('/settings'); setShowMenu(false); }} className="w-full text-left p-4 rounded-lg hover:bg-muted text-foreground">Settings</button>
            </nav>
          </div>
        </div>
      )}

      <QuickEntryDialogs
        type={quickEntryType}
        onClose={() => setQuickEntryType(null)}
        onSuccess={() => loadDashboardData()}
      />
    </div>
  );
};

export default Dashboard;
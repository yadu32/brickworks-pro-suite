import { TrendingUp, Package, Users, IndianRupee, AlertTriangle, Factory, ShoppingCart, CreditCard } from 'lucide-react';
import heroFactory from '@/assets/hero-factory.jpg';

const Dashboard = () => {
  // Sample data - would come from your state management/API
  const todayProduction = {
    fourInch: 120,
    sixInch: 75,
  };

  const monthlyProduction = {
    fourInch: 3240,
    sixInch: 2100,
  };

  const currentStock = {
    fourInch: 1450,
    sixInch: 890,
  };

  const salesMetrics = {
    todayRevenue: 15420,
    monthlyRevenue: 234580,
    outstandingReceivables: 45620,
  };

  const materialStock = {
    cement: { quantity: 45, unit: 'bags', value: 18000 },
    dust: { quantity: 12, unit: 'tons', value: 24000 },
    diesel: { quantity: 150, unit: 'liters', value: 12000 },
  };

  const recentPayments = {
    todayTotal: 8500,
    weeklyTotal: 35600,
  };

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
        {/* Today's Production */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Today's Production</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">4-inch Bricks</p>
                  <p className="text-metric">{todayProduction.fourInch.toLocaleString()}</p>
                  <p className="text-secondary">pieces produced</p>
                </div>
                <Factory className="h-12 w-12 text-primary" />
              </div>
            </div>
            
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">6-inch Bricks</p>
                  <p className="text-metric">{todayProduction.sixInch.toLocaleString()}</p>
                  <p className="text-secondary">pieces produced</p>
                </div>
                <Factory className="h-12 w-12 text-success" />
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Production & Current Stock */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Production & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-metric">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-secondary">Monthly 4-inch</p>
                <p className="text-2xl font-bold text-foreground">{monthlyProduction.fourInch.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="card-metric">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-secondary">Monthly 6-inch</p>
                <p className="text-2xl font-bold text-foreground">{monthlyProduction.sixInch.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="card-metric">
              <div className="text-center">
                <Package className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-secondary">4-inch Stock</p>
                <p className="text-2xl font-bold text-foreground">{currentStock.fourInch.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="card-metric">
              <div className="text-center">
                <Package className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-secondary">6-inch Stock</p>
                <p className="text-2xl font-bold text-foreground">{currentStock.sixInch.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Sales Performance */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sales Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Today's Revenue</p>
                  <p className="text-metric text-success">{formatCurrency(salesMetrics.todayRevenue)}</p>
                </div>
                <IndianRupee className="h-12 w-12 text-success" />
              </div>
            </div>
            
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Monthly Revenue</p>
                  <p className="text-metric text-success">{formatCurrency(salesMetrics.monthlyRevenue)}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-success" />
              </div>
            </div>
            
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Outstanding</p>
                  <p className="text-metric text-warning">{formatCurrency(salesMetrics.outstandingReceivables)}</p>
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
                <p className="text-xl font-bold text-foreground">{materialStock.cement.quantity} {materialStock.cement.unit}</p>
                <p className="text-secondary">{formatCurrency(materialStock.cement.value)}</p>
              </div>
            </div>
            
            <div className="card-metric">
              <div className="text-center">
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-secondary">Dust</p>
                <p className="text-xl font-bold text-foreground">{materialStock.dust.quantity} {materialStock.dust.unit}</p>
                <p className="text-secondary">{formatCurrency(materialStock.dust.value)}</p>
              </div>
            </div>
            
            <div className="card-metric">
              <div className="text-center">
                <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-secondary">Diesel</p>
                <p className="text-xl font-bold text-foreground">{materialStock.diesel.quantity} {materialStock.diesel.unit}</p>
                <p className="text-secondary">{formatCurrency(materialStock.diesel.value)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Employee Payments Summary */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Employee Payments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Today's Payments</p>
                  <p className="text-metric text-warning">{formatCurrency(recentPayments.todayTotal)}</p>
                </div>
                <Users className="h-12 w-12 text-warning" />
              </div>
            </div>
            
            <div className="card-metric">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-secondary">Weekly Payments</p>
                  <p className="text-metric text-warning">{formatCurrency(recentPayments.weeklyTotal)}</p>
                </div>
                <Users className="h-12 w-12 text-warning" />
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="animate-scale-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="card-dark p-4 text-center hover-scale">
              <Factory className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Add Production</p>
            </button>
            
            <button className="card-dark p-4 text-center hover-scale">
              <ShoppingCart className="h-8 w-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Record Sale</p>
            </button>
            
            <button className="card-dark p-4 text-center hover-scale">
              <Package className="h-8 w-8 text-warning mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Material Purchase</p>
            </button>
            
            <button className="card-dark p-4 text-center hover-scale">
              <CreditCard className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Employee Payment</p>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
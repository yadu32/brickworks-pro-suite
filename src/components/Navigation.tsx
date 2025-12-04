import { 
  BarChart3, 
  Factory, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Calendar,
  Settings,
  TrendingDown
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Other Expenses', icon: TrendingDown },
    { id: 'weekly', label: 'Reports', icon: Calendar },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Settings Button - Top Left */}
          <button
            onClick={() => onTabChange('settings')}
            className={`p-3 rounded-full transition-colors ${
              activeTab === 'settings' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card hover:bg-primary/20 text-foreground'
            }`}
          >
            <Settings className="h-6 w-6" />
          </button>
          
          <h1 className="text-xl font-bold text-foreground hidden sm:block">BrickWorks Manager</h1>
          
          <div className="hidden md:flex items-center space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={
                    activeTab === tab.id ? 'nav-tab-active' : 'nav-tab-inactive'
                  }
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <select
              value={activeTab}
              onChange={(e) => onTabChange(e.target.value)}
              className="input-dark py-2 px-3 rounded-lg bg-card"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
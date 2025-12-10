import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Factory, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Calendar,
  Settings,
  TrendingDown,
  Menu,
  X,
  LogOut,
  Crown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useFactory } from '@/hooks/useFactory';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { factory } = useFactory();
  const { logout } = useAuth();
  const factoryName = factory?.name || 'BrickWorks Manager';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Other Expenses', icon: TrendingDown },
    { id: 'weekly', label: 'Reports', icon: Calendar },
    { id: 'subscription', label: 'Subscription & Pricing', icon: Crown },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Menu Button - Top Left */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-3 rounded-full transition-colors bg-card hover:bg-primary/20 text-foreground"
              >
                <Menu className="h-6 w-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 bg-card border-border z-50">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-3 cursor-pointer ${
                      activeTab === tab.id ? 'bg-primary/20 text-primary' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="flex items-center gap-3 cursor-pointer text-destructive"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Factory Name - Center */}
          <h1 className="text-lg font-bold text-foreground truncate max-w-[200px] sm:max-w-none">{factoryName}</h1>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-2">
            {tabs.slice(0, 7).map((tab) => {
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

          {/* Empty div for spacing on mobile */}
          <div className="w-12 lg:hidden"></div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

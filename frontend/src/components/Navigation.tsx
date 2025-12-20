import { useState } from 'react';
import { 
  Home,
  Factory, 
  Package, 
  ShoppingCart, 
  Wallet,
  Calendar,
  Settings,
  Menu,
  X,
  LogOut,
  Crown,
  FileText,
  Shield
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useFactory } from '@/hooks/useFactory';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const { factory } = useFactory();
  const { logout } = useAuth();
  const factoryName = factory?.name || 'BricksFlow';
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Bottom Navigation Bar - 5 Main Tabs
  const mainTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'production', label: 'Production', icon: Factory },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'materials', label: 'Materials', icon: Package },
    { id: 'expenses', label: 'Expenses', icon: Wallet },
  ];

  // Side Drawer - Administrative Items
  const drawerItems = [
    { id: 'weekly', label: 'Reports', icon: FileText },
    { id: 'subscription', label: 'Subscription & Pricing', icon: Crown },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Top Bar with Factory Name and Hamburger Menu */}
      <nav className="bg-background border-b border-border sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Hamburger Menu - Left */}
            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <SheetTrigger asChild>
                <button className="p-3 rounded-full transition-colors bg-card hover:bg-primary/20 text-foreground">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-card border-border">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold text-foreground mb-4">
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  {drawerItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabChange(item.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === item.id
                            ? 'bg-primary/20 text-primary'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                  <hr className="my-4 border-border" />
                  <button
                    onClick={() => {
                      logout();
                      setIsDrawerOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-destructive/10 text-destructive"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                  
                  {/* Version Display */}
                  <div className="mt-auto pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                      BricksFlow v2.0.0
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Build: Dec 16, 2025
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Factory Name - Center */}
            <h1 className="text-lg font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
              {factoryName}
            </h1>
            
            {/* Empty div for spacing */}
            <div className="w-12"></div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar - Fixed at Bottom on Mobile, Visible on Desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:sticky md:top-16 md:bottom-auto">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex items-center justify-around h-16 gap-1">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center flex-1 h-full px-2 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className={`h-5 w-5 mb-1 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  <span className={`text-xs font-medium truncate max-w-full ${isActive ? 'font-semibold' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer for fixed bottom nav on mobile */}
      <div className="h-16 md:hidden"></div>
    </>
  );
};

export default Navigation;

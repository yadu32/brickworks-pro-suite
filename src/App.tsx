/**
 * BricksFlow App - Version 2.0.0
 * Build: December 16, 2025 - 21:45 UTC
 * Changes: Card-based production records, new navigation with bottom bar
 */
import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./components/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading: authLoading } = useAuth();
  const [hasFactory, setHasFactory] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserFactory = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('factories')
            .select('id')
            .eq('owner_id', user.id)
            .limit(1);
          
          if (error) throw error;
          setHasFactory(data && data.length > 0);
        } catch (error) {
          console.error('Error checking factory:', error);
          setHasFactory(false);
        } finally {
          setLoading(false);
        }
      } else {
        setHasFactory(null);
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkUserFactory();
    }
  }, [user, authLoading]);

  const handleOnboardingComplete = () => {
    setHasFactory(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            !user ? (
              <Auth />
            ) : !hasFactory ? (
              <Onboarding userId={user.id} onComplete={handleOnboardingComplete} />
            ) : (
              <Index />
            )
          } 
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
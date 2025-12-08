import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import TrialExpiredBanner from "@/components/TrialExpiredBanner";
import UpgradePlanModal from "@/components/UpgradePlanModal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./components/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasFactory, setHasFactory] = useState<boolean | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer the factory check with setTimeout
          setTimeout(() => {
            checkUserFactory(session.user.id);
          }, 0);
        } else {
          setHasFactory(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserFactory(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserFactory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('factories')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();

      if (error) throw error;
      setHasFactory(!!data);
    } catch (error) {
      console.error('Error checking factory:', error);
      setHasFactory(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    // Auth state change will handle the rest
  };

  const handleOnboardingComplete = () => {
    setHasFactory(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Main app content wrapped with subscription context
  const MainApp = () => (
    <SubscriptionProvider>
      <TrialExpiredBanner />
      <UpgradePlanModal />
      <Index />
    </SubscriptionProvider>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                !user ? (
                  <Auth onAuthSuccess={handleAuthSuccess} />
                ) : !hasFactory ? (
                  <Onboarding userId={user.id} onComplete={handleOnboardingComplete} />
                ) : (
                  <MainApp />
                )
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

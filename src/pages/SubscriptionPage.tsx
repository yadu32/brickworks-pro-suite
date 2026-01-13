import React, { useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionApi } from '@/api/subscription';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown, Zap, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface PlanDetails {
  type: 'monthly' | 'yearly';
  originalPrice: number;
  discountedPrice: number;
  label: string;
  badge?: string;
  buttonText: string;
  duration: number;
}

const plans: PlanDetails[] = [
  {
    type: 'monthly',
    originalPrice: 599,
    discountedPrice: 299,
    label: 'Monthly',
    badge: 'Save 50%',
    buttonText: 'Pay ₹299 & Activate',
    duration: 30,
  },
  {
    type: 'yearly',
    originalPrice: 7188,
    discountedPrice: 2999,
    label: 'Yearly Pro',
    badge: 'Super Saver Deal',
    buttonText: 'Pay ₹2,999 & Save Big',
    duration: 365,
  },
];

const features = [
  'Unlimited Production Entries',
  'Unlimited Sales & Invoices',
  'Supplier Ledger & Debt Tracking',
  'Cloud Backup & Data Security',
  'Priority Support',
];

// Frontend placeholder — replace with real Razorpay checkout integration
async function handleRazorpayPayment(amountInPaise: number, planId: string, onSuccess: () => void) {
  console.log('handleRazorpayPayment called:', amountInPaise, planId);
  
  // MOCK: Simulate successful payment
  toast.success('Mock payment successful! Activating subscription...');
  
  try {
    await subscriptionApi.completePayment({
      razorpay_payment_id: 'mock_payment_' + Date.now(),
      razorpay_order_id: 'mock_order_' + Date.now(),
      razorpay_signature: 'mock_signature',
      plan_id: planId,
    });
    
    toast.success('Subscription activated successfully!');
    onSuccess();
  } catch (error) {
    console.error('Payment completion error:', error);
    toast.error('Failed to activate subscription');
  }
}

const SubscriptionPage: React.FC = () => {
  const { refreshSubscription, isActive, subscriptionStatus, daysRemaining } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);

  const handleBackToDashboard = () => {
    // Use custom event to change tab in Index page
    window.dispatchEvent(new CustomEvent('changeTab', { detail: 'dashboard' }));
  };

  const handlePayment = async (plan: PlanDetails) => {
    setIsProcessing(true);
    setSelectedPlan(plan.type);

    try {
      await handleRazorpayPayment(
        plan.discountedPrice * 100,
        plan.type,
        async () => {
          await refreshSubscription();
          setIsProcessing(false);
          toast.success('Subscription activated! Redirecting to dashboard...');
          setTimeout(() => handleBackToDashboard(), 1000);
        }
      );
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleRestore = async () => {
    try {
      toast.info('Restoring subscription...');
      await subscriptionApi.restore();
      await refreshSubscription();
      toast.success('Subscription restored!');
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore subscription');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBackToDashboard}
          className="mb-6 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Current Status */}
        {isActive && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-400 font-medium">
              ✓ Active Subscription ({subscriptionStatus === 'lifetime' ? 'Lifetime' : subscriptionStatus})
              {subscriptionStatus !== 'lifetime' && ` - ${daysRemaining} days remaining`}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-1.5 text-sm font-semibold mb-4">
            <Sparkles className="h-4 w-4 mr-1" />
            Limited Time Launch Offer
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Upgrade to BricksFlow Premium
          </h1>
          <p className="text-muted-foreground text-lg">
            Your free trial has ended. Continue managing your factory with unlimited access.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.type}
              className={`relative rounded-xl border-2 p-6 transition-all ${
                plan.type === 'yearly'
                  ? 'border-amber-500 bg-amber-500/5 shadow-lg' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.badge && (
                <Badge className={`absolute -top-3 left-1/2 -translate-x-1/2 border-0 ${
                  plan.type === 'yearly' 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-green-500 text-white'
                }`}>
                  {plan.type === 'yearly' && <Crown className="h-3 w-3 mr-1" />}
                  {plan.badge}
                </Badge>
              )}

              <div className="text-center">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {plan.label}
                </h3>
                
                <div className="mb-6">
                  <span className="text-muted-foreground line-through text-sm">
                    ₹{plan.originalPrice.toLocaleString()}
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className={`text-4xl font-bold ${
                      plan.type === 'yearly' ? 'text-amber-500' : 'text-green-500'
                    }`}>
                      ₹{plan.discountedPrice.toLocaleString()}
                    </span>
                  </div>
                  {plan.type === 'monthly' && (
                    <p className="text-sm text-muted-foreground mt-2">Billed every month.</p>
                  )}
                  {plan.type === 'yearly' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Billed once a year. Less than ₹250/month!
                    </p>
                  )}
                </div>

                <Button
                  className={`w-full font-semibold h-12 text-base ${
                    plan.type === 'yearly' 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  size="lg"
                  onClick={() => handlePayment(plan)}
                  disabled={isProcessing}
                  aria-label={plan.buttonText}
                >
                  {isProcessing && selectedPlan === plan.type ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      {plan.buttonText}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h4 className="text-lg font-semibold text-foreground mb-4 text-center">
            Everything included:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Restore Purchase */}
        <div className="text-center mb-4">
          <button 
            onClick={handleRestore}
            className="text-sm text-primary hover:underline"
          >
            Restore Purchase
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center">
          Secure payment powered by Razorpay.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { subscriptionApi } from '@/api/subscription';
import { toast } from 'sonner';

interface PlanDetails {
  type: 'monthly' | 'yearly';
  originalPrice: number;
  discountedPrice: number;
  label: string;
  badge?: string;
  buttonText: string;
  duration: number; // in days
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
  // 1) POST /api/subscription/create-order { amount_in_paise, plan_id } -> returns { order_id, razorpay_key }
  // 2) Launch Razorpay Checkout with orderId & razorpayKey (or simulate)
  // 3) On payment success, call POST /api/subscription/complete { razorpay_payment_id, razorpay_order_id, razorpay_signature, plan_id }
  console.log('handleRazorpayPayment called:', amountInPaise, planId);
  
  // MOCK: Simulate successful payment
  toast.success('Mock payment successful! Activating subscription...');
  
  try {
    // Call complete payment endpoint with mock data
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

const UpgradePlanModal: React.FC = () => {
  const { showUpgradeModal, setShowUpgradeModal, refreshSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);

  const handlePayment = async (plan: PlanDetails) => {
    setIsProcessing(true);
    setSelectedPlan(plan.type);

    try {
      await handleRazorpayPayment(
        plan.discountedPrice * 100,
        plan.type,
        async () => {
          await refreshSubscription();
          setShowUpgradeModal(false);
          setIsProcessing(false);
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
      setShowUpgradeModal(false);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore subscription');
    }
  };

  const handleGoToSubscriptionPage = () => {
    setShowUpgradeModal(false);
    window.dispatchEvent(new CustomEvent('changeTab', { detail: 'subscription' }));
  };

  return (
    <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 mr-1" />
              Limited Time Launch Offer
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Upgrade to BricksFlow Premium
          </DialogTitle>
          <p className="text-muted-foreground mt-1">
            Your free trial has ended. Continue managing your factory with unlimited access.
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {plans.map((plan) => (
            <div
              key={plan.type}
              className={`relative rounded-xl border-2 p-5 transition-all ${
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
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {plan.label}
                </h3>
                
                <div className="mb-4">
                  <span className="text-muted-foreground line-through text-sm">
                    ₹{plan.originalPrice.toLocaleString()}
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mt-1">
                    <span className={`text-3xl font-bold ${
                      plan.type === 'yearly' ? 'text-amber-500' : 'text-green-500'
                    }`}>
                      ₹{plan.discountedPrice.toLocaleString()}
                    </span>
                  </div>
                  {plan.type === 'monthly' && (
                    <p className="text-xs text-muted-foreground mt-1">Billed every month.</p>
                  )}
                  {plan.type === 'yearly' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Billed once a year. Less than ₹250/month!
                    </p>
                  )}
                </div>

                <Button
                  className={`w-full font-semibold ${
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
                      <Zap className="h-4 w-4 mr-2" />
                      {plan.buttonText}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3 text-center">
            Everything included:
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-4 space-y-2">
          <button 
            onClick={handleGoToSubscriptionPage}
            className="text-sm text-primary hover:underline font-medium"
          >
            View Full Pricing Page
          </button>
          <br />
          <button 
            onClick={handleRestore}
            className="text-sm text-muted-foreground hover:underline"
          >
            Restore Purchase
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          Secure payment powered by Razorpay.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePlanModal;

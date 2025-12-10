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

const UpgradePlanModal: React.FC = () => {
  const { showUpgradeModal, setShowUpgradeModal, factoryId, refreshSubscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (plan: PlanDetails) => {
    setIsProcessing(true);
    setSelectedPlan(plan.type);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway');
        setIsProcessing(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to continue');
        setIsProcessing(false);
        return;
      }

      const options = {
        key: RAZORPAY_KEY,
        amount: plan.discountedPrice * 100, // Amount in paise
        currency: 'INR',
        name: 'BrickWorks Manager',
        description: `${plan.label} Subscription`,
        prefill: {
          email: user.email,
        },
        theme: {
          color: '#FF6B00',
        },
        handler: async function (response: any) {
          // Payment successful
          console.log('Payment successful:', response);
          
          // Update subscription in database
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + plan.duration);

          const { error } = await supabase
            .from('factories')
            .update({
              subscription_status: 'active',
              plan_type: plan.type,
              plan_expiry_date: expiryDate.toISOString(),
            })
            .eq('id', factoryId);

          if (error) {
            console.error('Error updating subscription:', error);
            toast.error('Payment received but failed to activate. Please contact support.');
          } else {
            toast.success('Subscription activated successfully!');
            await refreshSubscription();
            setShowUpgradeModal(false);
          }
          setIsProcessing(false);
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setSelectedPlan(null);
          },
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  return (
    <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
      <DialogContent className="sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-1.5 text-sm font-semibold">
              <Sparkles className="h-4 w-4 mr-1" />
              50% OFF - Launch Offer!
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Upgrade Your Plan
          </DialogTitle>
          <p className="text-muted-foreground mt-1">
            Unlock all features and grow your business
          </p>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {plans.map((plan) => (
            <div
              key={plan.type}
              className={`relative rounded-xl border-2 p-5 transition-all ${
                plan.badge 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground border-0">
                  <Crown className="h-3 w-3 mr-1" />
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
                    <span className="text-3xl font-bold text-foreground">
                      ₹{plan.discountedPrice.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      /{plan.type === 'monthly' ? 'month' : 'year'}
                    </span>
                  </div>
                  <Badge variant="secondary" className="mt-2 bg-green-500/20 text-green-400 border-0">
                    Save {Math.round((1 - plan.discountedPrice / plan.originalPrice) * 100)}%
                  </Badge>
                </div>

                <Button
                  className="w-full font-semibold"
                  size="lg"
                  onClick={() => handlePayment(plan)}
                  disabled={isProcessing}
                >
                  {isProcessing && selectedPlan === plan.type ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Pay ₹{plan.discountedPrice.toLocaleString()} & Activate
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
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Secure payment powered by Razorpay. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePlanModal;

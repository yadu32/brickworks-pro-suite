import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded: (customerName: string, customerPhone: string) => void;
}

export function AddCustomerDialog({ open, onOpenChange, onCustomerAdded }: AddCustomerDialogProps) {
  const { toast } = useToast();
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: ''
  });

  useEffect(() => {
    loadFactory();
  }, []);

  const loadFactory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('factories').select('id').eq('owner_id', user.id).single();
    if (data) setFactoryId(data.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !factoryId) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('customers').insert({
      factory_id: factoryId,
      name: formData.customer_name,
      phone: formData.customer_phone || null
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Customer added' });
    onCustomerAdded(formData.customer_name, formData.customer_phone);
    setFormData({ customer_name: '', customer_phone: '' });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customer_name">Customer Name *</Label>
            <Input id="customer_name" value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="customer_phone">Phone Number</Label>
            <Input id="customer_phone" type="tel" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Customer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFactory } from '@/hooks/useFactory';
import { supplierApi } from '@/api';

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplierAdded: (supplierName: string, supplierPhone?: string) => void;
}

export function AddSupplierDialog({ open, onOpenChange, onSupplierAdded }: AddSupplierDialogProps) {
  const { toast } = useToast();
  const { factoryId } = useFactory();
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_name || !factoryId) {
      toast({ title: 'Error', description: 'Supplier name is required', variant: 'destructive' });
      return;
    }

    try {
      await supplierApi.create({
        factory_id: factoryId,
        name: formData.supplier_name,
        contact_number: formData.supplier_phone || undefined
      });

      toast({ title: 'Success', description: 'Supplier saved' });
      onSupplierAdded(formData.supplier_name, formData.supplier_phone);
      setFormData({ supplier_name: '', supplier_phone: '' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to add supplier', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="supplier_name">Supplier Name *</Label>
            <Input
              id="supplier_name"
              value={formData.supplier_name}
              onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="supplier_phone">Supplier Phone</Label>
            <Input
              id="supplier_phone"
              type="tel"
              value={formData.supplier_phone}
              onChange={(e) => setFormData({ ...formData, supplier_phone: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Supplier</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

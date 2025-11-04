import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface AddSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplierAdded: (supplierName: string, supplierPhone?: string) => void;
}

export function AddSupplierDialog({ open, onOpenChange, onSupplierAdded }: AddSupplierDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    supplier_name: '',
    supplier_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.supplier_name) {
      toast({ title: 'Error', description: 'Supplier name is required', variant: 'destructive' });
      return;
    }

    toast({ title: 'Success', description: 'Supplier saved' });
    onSupplierAdded(formData.supplier_name, formData.supplier_phone);
    setFormData({ supplier_name: '', supplier_phone: '' });
    onOpenChange(false);
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

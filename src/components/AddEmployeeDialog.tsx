import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useFactory } from '@/hooks/useFactory';
import { employeeApi } from '@/api';

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeAdded: (employeeName: string) => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onEmployeeAdded }: AddEmployeeDialogProps) {
  const { toast } = useToast();
  const { factoryId } = useFactory();
  const [formData, setFormData] = useState({ employee_name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_name || !factoryId) {
      toast({ title: 'Error', description: 'Employee name is required', variant: 'destructive' });
      return;
    }

    try {
      await employeeApi.create({
        factory_id: factoryId,
        name: formData.employee_name,
        is_active: true
      });

      toast({ title: 'Employee added' });
      onEmployeeAdded(formData.employee_name);
      setFormData({ employee_name: '' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to add employee', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee_name">Employee Name *</Label>
            <Input id="employee_name" value={formData.employee_name} onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save Employee</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

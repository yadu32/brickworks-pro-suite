import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AddCustomerDialog } from '@/components/AddCustomerDialog';
import { AddEmployeeDialog } from '@/components/AddEmployeeDialog';

interface QuickEntryDialogsProps {
  type: 'sale' | 'production' | 'usage' | 'payment' | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function QuickEntryDialogs({ type, onClose, onSuccess }: QuickEntryDialogsProps) {
  const { toast } = useToast();
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string; phone: string }>>([]);
  const [employeeOptions, setEmployeeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);

  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    product_id: '',
    quantity_sold: '',
    rate_per_brick: '',
    amount_received: '',
    notes: ''
  });

  const [productionForm, setProductionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    product_id: '',
    punches: '',
    quantity: '',
    remarks: ''
  });

  const [usageForm, setUsageForm] = useState({
    date: new Date().toISOString().split('T')[0],
    material_id: '',
    quantity_used: '',
    purpose: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    employee_name: '',
    amount: '',
    payment_type: '',
    notes: ''
  });

  useEffect(() => {
    loadFactory();
  }, []);

  useEffect(() => {
    if (type && factoryId) {
      loadInitialData();
    }
  }, [type, factoryId]);

  const loadFactory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('factories')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (data) {
      setFactoryId(data.id);
    }
  };

  const loadInitialData = async () => {
    if (!factoryId) return;

    // Load products (brick types) for this factory
    const { data: productData } = await supabase
      .from('product_definitions')
      .select('*')
      .eq('factory_id', factoryId);
    if (productData) setProducts(productData);

    // Load materials for this factory
    const { data: materialData } = await supabase
      .from('materials')
      .select('*')
      .eq('factory_id', factoryId);
    if (materialData) setMaterials(materialData);

    // Load customers for this factory
    const { data: customersData } = await supabase
      .from('customers')
      .select('*')
      .eq('factory_id', factoryId);
    if (customersData) {
      setCustomerOptions(customersData.map(c => ({
        value: c.name,
        label: c.name,
        phone: c.phone || ''
      })));
    }

    // Load employees for this factory
    const { data: employeesData } = await supabase
      .from('employees')
      .select('*')
      .eq('factory_id', factoryId)
      .eq('is_active', true);
    if (employeesData) {
      setEmployeeOptions(employeesData.map(e => ({ value: e.name, label: e.name })));
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryId) return;

    const selectedProduct = products.find(p => p.id === saleForm.product_id);

    const { error } = await supabase.from('sales').insert([{
      factory_id: factoryId,
      date: saleForm.date,
      customer_name: saleForm.customer_name,
      customer_phone: saleForm.customer_phone || null,
      product_id: saleForm.product_id,
      quantity_sold: Number(saleForm.quantity_sold),
      rate_per_brick: Number(saleForm.rate_per_brick),
      total_amount: Number(saleForm.quantity_sold) * Number(saleForm.rate_per_brick),
      amount_received: Number(saleForm.amount_received || 0),
      balance_due: (Number(saleForm.quantity_sold) * Number(saleForm.rate_per_brick)) - Number(saleForm.amount_received || 0),
      notes: saleForm.notes || null
    }]);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sale added successfully' });
      onSuccess();
      onClose();
    }
  };

  const handleProductionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryId) return;

    const selectedProduct = products.find(p => p.id === productionForm.product_id);

    const { error } = await supabase.from('production_logs').insert([{
      factory_id: factoryId,
      date: productionForm.date,
      product_id: productionForm.product_id,
      product_name: selectedProduct?.name || '',
      punches: Number(productionForm.punches) || null,
      quantity: Number(productionForm.quantity),
      remarks: productionForm.remarks || null
    }]);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Production recorded successfully' });
      onSuccess();
      onClose();
    }
  };

  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryId) return;

    const { error } = await supabase.from('material_usage').insert([{
      factory_id: factoryId,
      date: usageForm.date,
      material_id: usageForm.material_id,
      quantity_used: Number(usageForm.quantity_used),
      purpose: usageForm.purpose
    }]);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Material usage recorded successfully' });
      onSuccess();
      onClose();
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryId) return;

    const { error } = await supabase.from('employee_payments').insert([{
      factory_id: factoryId,
      date: paymentForm.date,
      employee_name: paymentForm.employee_name,
      amount: Number(paymentForm.amount),
      payment_type: paymentForm.payment_type,
      notes: paymentForm.notes || null
    }]);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Payment recorded successfully' });
      onSuccess();
      onClose();
    }
  };

  return (
    <>
      <Dialog open={type === 'sale'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={saleForm.date} onChange={(e) => setSaleForm({...saleForm, date: e.target.value})} required />
              </div>
              <div>
                <Label>Product Type</Label>
                <Select value={saleForm.product_id} onValueChange={(value) => setSaleForm({...saleForm, product_id: value})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer Name</Label>
                <SearchableSelect
                  value={saleForm.customer_name}
                  onValueChange={(value) => {
                    const customer = customerOptions.find(c => c.value === value);
                    setSaleForm({ ...saleForm, customer_name: value, customer_phone: customer?.phone || '' });
                  }}
                  options={customerOptions}
                  placeholder="Select customer..."
                  onAddNew={() => setIsAddCustomerOpen(true)}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={saleForm.customer_phone} readOnly className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={saleForm.quantity_sold} onChange={(e) => setSaleForm({...saleForm, quantity_sold: e.target.value})} required />
              </div>
              <div>
                <Label>Rate per Unit (₹)</Label>
                <Input type="number" step="0.01" value={saleForm.rate_per_brick} onChange={(e) => setSaleForm({...saleForm, rate_per_brick: e.target.value})} required />
              </div>
            </div>
            <div>
              <Label>Amount Received (₹)</Label>
              <Input type="number" step="0.01" value={saleForm.amount_received} onChange={(e) => setSaleForm({...saleForm, amount_received: e.target.value})} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={saleForm.notes} onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Sale</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={type === 'production'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Production Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductionSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={productionForm.date} onChange={(e) => setProductionForm({...productionForm, date: e.target.value})} required />
              </div>
              <div>
                <Label>Brick Type</Label>
                <Select value={productionForm.product_id} onValueChange={(value) => setProductionForm({...productionForm, product_id: value})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Number of Punches</Label>
                <Input type="number" value={productionForm.punches} onChange={(e) => setProductionForm({...productionForm, punches: e.target.value})} required />
              </div>
              <div>
                <Label>Actual Quantity Produced</Label>
                <Input type="number" value={productionForm.quantity} onChange={(e) => setProductionForm({...productionForm, quantity: e.target.value})} required />
              </div>
            </div>
            <div>
              <Label>Remarks</Label>
              <Textarea value={productionForm.remarks} onChange={(e) => setProductionForm({...productionForm, remarks: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Production</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={type === 'usage'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Material Usage</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUsageSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={usageForm.date} onChange={(e) => setUsageForm({...usageForm, date: e.target.value})} required />
              </div>
              <div>
                <Label>Material</Label>
                <Select value={usageForm.material_id} onValueChange={(value) => setUsageForm({...usageForm, material_id: value})}>
                  <SelectTrigger><SelectValue placeholder="Select material" /></SelectTrigger>
                  <SelectContent>
                    {materials.map(m => <SelectItem key={m.id} value={m.id}>{m.material_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Quantity Used</Label>
              <Input type="number" step="0.01" value={usageForm.quantity_used} onChange={(e) => setUsageForm({...usageForm, quantity_used: e.target.value})} required />
            </div>
            <div>
              <Label>Reason for Use</Label>
              <Input value={usageForm.purpose} onChange={(e) => setUsageForm({...usageForm, purpose: e.target.value})} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Usage</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={type === 'payment'} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} required />
              </div>
              <div>
                <Label>Payment Type</Label>
                <Select value={paymentForm.payment_type} onValueChange={(value) => setPaymentForm({...paymentForm, payment_type: value})}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Advance">Advance</SelectItem>
                    <SelectItem value="Bonus">Bonus</SelectItem>
                    <SelectItem value="Incentive">Incentive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employee Name</Label>
                <SearchableSelect
                  value={paymentForm.employee_name}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, employee_name: value })}
                  options={employeeOptions}
                  placeholder="Select employee..."
                  onAddNew={() => setIsAddEmployeeOpen(true)}
                />
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} required />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Payment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AddCustomerDialog
        open={isAddCustomerOpen}
        onOpenChange={setIsAddCustomerOpen}
        onCustomerAdded={(name, phone) => {
          setSaleForm({ ...saleForm, customer_name: name, customer_phone: phone });
          loadInitialData();
        }}
      />

      <AddEmployeeDialog
        open={isAddEmployeeOpen}
        onOpenChange={setIsAddEmployeeOpen}
        onEmployeeAdded={(name) => {
          setPaymentForm({ ...paymentForm, employee_name: name });
          loadInitialData();
        }}
      />
    </>
  );
}

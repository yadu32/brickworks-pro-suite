import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, TrendingDown, AlertTriangle, Fuel, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AddSupplierDialog } from '@/components/AddSupplierDialog';

interface Material {
  id: string;
  material_name: string;
  current_stock_qty: number;
  unit: string;
  average_cost_per_unit: number;
}

interface MaterialPurchase {
  id: string;
  date: string;
  material_id: string;
  quantity_purchased: number;
  unit_cost: number;
  supplier_name: string;
  supplier_phone: string;
  payment_made: number;
  notes: string;
  materials: {
    id: string;
    material_name: string;
    unit: string;
  };
}

interface MaterialUsage {
  id: string;
  date: string;
  material_id: string;
  quantity_used: number;
  purpose: string;
  materials: {
    id: string;
    material_name: string;
    unit: string;
  };
}

const MaterialsModule = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [usage, setUsage] = useState<MaterialUsage[]>([]);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<MaterialPurchase | null>(null);
  const [editingUsage, setEditingUsage] = useState<MaterialUsage | null>(null);
  const [isAddSupplierDialogOpen, setIsAddSupplierDialogOpen] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState<Array<{ value: string; label: string }>>([]);
  const { toast } = useToast();

  const [purchaseForm, setPurchaseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    material_id: '',
    quantity_purchased: '',
    unit_cost: '',
    supplier_name: '',
    supplier_phone: '',
    payment_made: '',
    notes: ''
  });

  const [usageForm, setUsageForm] = useState({
    date: new Date().toISOString().split('T')[0],
    material_id: '',
    quantity_used: '',
    purpose: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const loadMaterials = async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('material_name');
    
    if (error) {
      toast({ title: 'Error loading materials', description: error.message, variant: 'destructive' });
    } else {
      setMaterials(data || []);
    }
  };

  const loadPurchases = async () => {
    const { data, error } = await supabase
      .from('material_purchases')
      .select(`
        *,
        materials (
          id,
          material_name,
          unit
        )
      `)
      .order('date', { ascending: false });
    
    if (error) {
      toast({ title: 'Error loading purchases', description: error.message, variant: 'destructive' });
    } else {
      setPurchases(data || []);
    }
  };

  const loadUsage = async () => {
    const { data, error } = await supabase
      .from('material_usage')
      .select(`
        *,
        materials (
          id,
          material_name,
          unit
        )
      `)
      .order('date', { ascending: false });
    
    if (error) {
      toast({ title: 'Error loading usage', description: error.message, variant: 'destructive' });
    } else {
      setUsage(data || []);
    }
  };

  const loadSuppliers = async () => {
    const { data } = await supabase
      .from('material_purchases')
      .select('supplier_name, supplier_phone')
      .order('supplier_name');
    
    if (data) {
      const uniqueSuppliers = Array.from(
        new Map(data.map(item => [item.supplier_name, item])).values()
      );
      setSupplierOptions(
        uniqueSuppliers.map(s => ({
          value: s.supplier_name,
          label: s.supplier_name
        }))
      );
    }
  };

  const updateMaterialStock = async (materialId: string) => {
    // Calculate total purchases
    const { data: purchaseData } = await supabase
      .from('material_purchases')
      .select('quantity_purchased, unit_cost')
      .eq('material_id', materialId);

    // Calculate total usage
    const { data: usageData } = await supabase
      .from('material_usage')
      .select('quantity_used')
      .eq('material_id', materialId);

    const totalPurchased = purchaseData?.reduce((sum, p) => sum + Number(p.quantity_purchased), 0) || 0;
    const totalUsed = usageData?.reduce((sum, u) => sum + Number(u.quantity_used), 0) || 0;
    const currentStock = totalPurchased - totalUsed;

    // Calculate average cost
    const totalValue = purchaseData?.reduce((sum, p) => sum + (Number(p.quantity_purchased) * Number(p.unit_cost)), 0) || 0;
    const averageCost = totalPurchased > 0 ? totalValue / totalPurchased : 0;

    await supabase
      .from('materials')
      .update({
        current_stock_qty: currentStock,
        average_cost_per_unit: averageCost
      })
      .eq('id', materialId);
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const purchaseData = {
      date: purchaseForm.date,
      material_id: purchaseForm.material_id,
      quantity_purchased: Number(purchaseForm.quantity_purchased),
      unit_cost: Number(purchaseForm.unit_cost),
      supplier_name: purchaseForm.supplier_name,
      supplier_phone: purchaseForm.supplier_phone,
      payment_made: Number(purchaseForm.payment_made),
      notes: purchaseForm.notes
    };

    if (editingPurchase) {
      const { error } = await supabase
        .from('material_purchases')
        .update(purchaseData)
        .eq('id', editingPurchase.id);
      
      if (error) {
        toast({ title: 'Error updating purchase', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('material_purchases')
        .insert([purchaseData]);
      
      if (error) {
        toast({ title: 'Error adding purchase', description: error.message, variant: 'destructive' });
        return;
      }
    }

    await updateMaterialStock(purchaseForm.material_id);
    await loadPurchases();
    await loadMaterials();
    
    setIsPurchaseDialogOpen(false);
    setEditingPurchase(null);
    setPurchaseForm({
      date: new Date().toISOString().split('T')[0],
      material_id: '',
      quantity_purchased: '',
      unit_cost: '',
      supplier_name: '',
      supplier_phone: '',
      payment_made: '',
      notes: ''
    });
    
    toast({ title: editingPurchase ? 'Purchase updated successfully' : 'Purchase added successfully' });
  };

  const handleUsageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const usageData = {
      date: usageForm.date,
      material_id: usageForm.material_id,
      quantity_used: Number(usageForm.quantity_used),
      purpose: usageForm.purpose
    };

    if (editingUsage) {
      const { error } = await supabase
        .from('material_usage')
        .update(usageData)
        .eq('id', editingUsage.id);
      
      if (error) {
        toast({ title: 'Error updating usage', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('material_usage')
        .insert([usageData]);
      
      if (error) {
        toast({ title: 'Error adding usage', description: error.message, variant: 'destructive' });
        return;
      }
    }

    await updateMaterialStock(usageForm.material_id);
    await loadUsage();
    await loadMaterials();
    
    setIsUsageDialogOpen(false);
    setEditingUsage(null);
    setUsageForm({
      date: new Date().toISOString().split('T')[0],
      material_id: '',
      quantity_used: '',
      purpose: ''
    });
    
    toast({ title: editingUsage ? 'Usage updated successfully' : 'Usage added successfully' });
  };

  const [deleteDialogState, setDeleteDialogState] = useState<{open: boolean, id: string, materialId: string, type: 'purchase' | 'usage'}>({
    open: false,
    id: '',
    materialId: '',
    type: 'purchase'
  });

  const deletePurchase = async (id: string, materialId: string) => {
    const { error } = await supabase
      .from('material_purchases')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error deleting purchase', description: error.message, variant: 'destructive' });
    } else {
      await updateMaterialStock(materialId);
      await loadPurchases();
      await loadMaterials();
      toast({ title: 'Purchase deleted successfully' });
    }
    setDeleteDialogState({open: false, id: '', materialId: '', type: 'purchase'});
  };

  const deleteUsage = async (id: string, materialId: string) => {
    const { error } = await supabase
      .from('material_usage')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error deleting usage', description: error.message, variant: 'destructive' });
    } else {
      await updateMaterialStock(materialId);
      await loadUsage();
      await loadMaterials();
      toast({ title: 'Usage deleted successfully' });
    }
    setDeleteDialogState({open: false, id: '', materialId: '', type: 'usage'});
  };

  const editPurchase = (purchase: MaterialPurchase) => {
    setEditingPurchase(purchase);
    setPurchaseForm({
      date: purchase.date,
      material_id: purchase.material_id,
      quantity_purchased: purchase.quantity_purchased.toString(),
      unit_cost: purchase.unit_cost.toString(),
      supplier_name: purchase.supplier_name,
      supplier_phone: purchase.supplier_phone || '',
      payment_made: purchase.payment_made.toString(),
      notes: purchase.notes || ''
    });
    setIsPurchaseDialogOpen(true);
  };

  const editUsage = (usageItem: MaterialUsage) => {
    setEditingUsage(usageItem);
    setUsageForm({
      date: usageItem.date,
      material_id: usageItem.material_id,
      quantity_used: usageItem.quantity_used.toString(),
      purpose: usageItem.purpose
    });
    setIsUsageDialogOpen(true);
  };

  useEffect(() => {
    loadMaterials();
    loadPurchases();
    loadUsage();
    loadSuppliers();
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [purchases]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-foreground">Materials Management</h1>
          <div className="flex gap-4">
            <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Purchase
                </Button>
              </DialogTrigger>
              <DialogContent className="modal-content">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {editingPurchase ? 'Edit Purchase' : 'Add Material Purchase'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={purchaseForm.date}
                        onChange={(e) => setPurchaseForm({...purchaseForm, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="material">Material</Label>
                      <Select value={purchaseForm.material_id} onValueChange={(value) => setPurchaseForm({...purchaseForm, material_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border z-[200]" position="popper" sideOffset={4}>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.material_name} ({material.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Quantity Purchased</Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        value={purchaseForm.quantity_purchased}
                        onChange={(e) => setPurchaseForm({...purchaseForm, quantity_purchased: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="unitCost">Unit Cost (₹)</Label>
                      <Input
                        id="unitCost"
                        type="number"
                        step="0.01"
                        value={purchaseForm.unit_cost}
                        onChange={(e) => setPurchaseForm({...purchaseForm, unit_cost: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="supplier">Supplier Name</Label>
                      <SearchableSelect
                        value={purchaseForm.supplier_name}
                        onValueChange={(value) => {
                          setPurchaseForm({...purchaseForm, supplier_name: value});
                          const supplier = purchases.find(p => p.supplier_name === value);
                          if (supplier && supplier.supplier_phone) {
                            setPurchaseForm({...purchaseForm, supplier_name: value, supplier_phone: supplier.supplier_phone});
                          }
                        }}
                        options={supplierOptions}
                        placeholder="Select supplier"
                        searchPlaceholder="Search suppliers..."
                        onAddNew={() => setIsAddSupplierDialogOpen(true)}
                        addNewLabel="Add Supplier"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Supplier Phone</Label>
                      <Input
                        id="phone"
                        value={purchaseForm.supplier_phone}
                        onChange={(e) => setPurchaseForm({...purchaseForm, supplier_phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="payment">Payment Made (₹)</Label>
                    <Input
                      id="payment"
                      type="number"
                      step="0.01"
                      value={purchaseForm.payment_made}
                      onChange={(e) => setPurchaseForm({...purchaseForm, payment_made: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={purchaseForm.notes}
                      onChange={(e) => setPurchaseForm({...purchaseForm, notes: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => setIsPurchaseDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="btn-primary">
                      {editingPurchase ? 'Update' : 'Add'} Purchase
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
              <DialogTrigger asChild>
                <Button className="btn-secondary">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Add Usage
                </Button>
              </DialogTrigger>
              <DialogContent className="modal-content">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {editingUsage ? 'Edit Usage' : 'Add Material Usage'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUsageSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="usageDate">Date</Label>
                      <Input
                        id="usageDate"
                        type="date"
                        value={usageForm.date}
                        onChange={(e) => setUsageForm({...usageForm, date: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="usageMaterial">Material</Label>
                      <Select value={usageForm.material_id} onValueChange={(value) => setUsageForm({...usageForm, material_id: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border border-border z-[200]" position="popper" sideOffset={4}>
                          {materials.map((material) => (
                            <SelectItem key={material.id} value={material.id}>
                              {material.material_name} ({material.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="usageQuantity">Quantity Used</Label>
                    <Input
                      id="usageQuantity"
                      type="number"
                      step="0.01"
                      value={usageForm.quantity_used}
                      onChange={(e) => setUsageForm({...usageForm, quantity_used: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="purpose">Purpose</Label>
                    <Input
                      id="purpose"
                      value={usageForm.purpose}
                      onChange={(e) => setUsageForm({...usageForm, purpose: e.target.value})}
                      required
                      placeholder="e.g., Production batch #123, Maintenance"
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => setIsUsageDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="btn-secondary">
                      {editingUsage ? 'Update' : 'Add'} Usage
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogState.open} onOpenChange={(open) => setDeleteDialogState({...deleteDialogState, open})}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this {deleteDialogState.type} record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (deleteDialogState.type === 'purchase') {
                  deletePurchase(deleteDialogState.id, deleteDialogState.materialId);
                } else {
                  deleteUsage(deleteDialogState.id, deleteDialogState.materialId);
                }
              }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Material Stock Overview */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Current Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {materials.map((material) => (
              <div key={material.id} className="card-metric">
                <div className="text-center">
                  {material.material_name === 'Cement' && <Package className="h-8 w-8 text-primary mx-auto mb-2" />}
                  {material.material_name === 'Dust' && <Package className="h-8 w-8 text-secondary mx-auto mb-2" />}
                  {material.material_name === 'Diesel' && <Fuel className="h-8 w-8 text-warning mx-auto mb-2" />}
                  <p className="text-secondary">{material.material_name}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {material.current_stock_qty.toLocaleString()} {material.unit}
                  </p>
                  <p className="text-secondary">{formatCurrency(material.current_stock_qty * material.average_cost_per_unit)}</p>
                  {material.current_stock_qty < 10 && (
                    <div className="flex items-center justify-center mt-2 text-warning">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Low Stock</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Purchases with Scrollable Table */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Recent Purchases</h2>
          <div className="card-dark">
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10 border-b-2 border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Date</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Material & Qty</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Supplier</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Total Cost</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Balance</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-border hover:bg-accent/5">
                      <td className="py-3 px-4 text-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-secondary" />
                          {new Date(purchase.date).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        <div>
                          <p className="font-medium">{purchase.materials.material_name}</p>
                          <p className="text-sm text-secondary">{purchase.quantity_purchased} {purchase.materials.unit}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        <div>
                          <p>{purchase.supplier_name}</p>
                          {purchase.supplier_phone && (
                            <p className="text-sm text-secondary">{purchase.supplier_phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {formatCurrency(purchase.quantity_purchased * purchase.unit_cost)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm px-2 py-1 rounded ${
                          (purchase.quantity_purchased * purchase.unit_cost) - purchase.payment_made > 0 
                            ? 'bg-warning/20 text-warning' 
                            : 'bg-success/20 text-success'
                        }`}>
                          {formatCurrency((purchase.quantity_purchased * purchase.unit_cost) - purchase.payment_made)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => editPurchase(purchase)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setDeleteDialogState({open: true, id: purchase.id, materialId: purchase.material_id, type: 'purchase'})}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recent Usage with Scrollable Table */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Recent Usage</h2>
          <div className="card-dark">
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10 border-b-2 border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Date</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Material & Qty</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Purpose</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.map((usageItem) => (
                    <tr key={usageItem.id} className="border-b border-border hover:bg-accent/5">
                      <td className="py-3 px-4 text-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-secondary" />
                          {new Date(usageItem.date).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        <div>
                          <p className="font-medium">{usageItem.materials.material_name}</p>
                          <p className="text-sm text-secondary">{usageItem.quantity_used} {usageItem.materials.unit}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {usageItem.purpose}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => editUsage(usageItem)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setDeleteDialogState({open: true, id: usageItem.id, materialId: usageItem.material_id, type: 'usage'})}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <AddSupplierDialog
        open={isAddSupplierDialogOpen}
        onOpenChange={setIsAddSupplierDialogOpen}
        onSupplierAdded={(supplierName, supplierPhone) => {
          // Update form with new supplier data
          setPurchaseForm(prev => ({...prev, supplier_name: supplierName, supplier_phone: supplierPhone || ''}));
          // Add the new supplier to the options list immediately
          setSupplierOptions(prev => {
            const exists = prev.some(s => s.value === supplierName);
            if (!exists) {
              return [...prev, { value: supplierName, label: supplierName }];
            }
            return prev;
          });
        }}
      />
    </div>
  );
};

export default MaterialsModule;
import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Factory, Calendar, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFactory } from '@/hooks/useFactory';
import { productApi, productionApi, ProductDefinition, ProductionLog } from '@/api';

interface FormData {
  date: string;
  product_id: string;
  punches: string;
  quantity: string;
  remarks: string;
}

const ProductionModule = () => {
  const { toast } = useToast();
  const { factoryId } = useFactory();
  const [productionRecords, setProductionRecords] = useState<ProductionLog[]>([]);
  const [productTypes, setProductTypes] = useState<ProductDefinition[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionLog | null>(null);
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    product_id: '',
    punches: '',
    quantity: '',
    remarks: ''
  });

  const isReadOnly = false; // Subscription logic

  const handleAddClick = () => {
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (factoryId) {
      loadProductTypes();
      loadProductionRecords();
    }
  }, [factoryId]);

  // ROBUST FIX: Auto-select first product when data loads
  useEffect(() => {
    if (productTypes.length > 0 && !formData.product_id && !editingRecord) {
      setFormData(prev => ({ ...prev, product_id: productTypes[0].id }));
    }
  }, [productTypes, editingRecord]);

  const loadProductTypes = async () => {
    if (!factoryId) return;
    
    try {
      const data = await productApi.getByFactory(factoryId);
      setProductTypes(data || []);
    } catch (error) {
      console.error('Error loading product types:', error);
      toast({ title: "Error", description: "Failed to load product types", variant: "destructive" });
    }
  };

  const loadProductionRecords = async () => {
    if (!factoryId) return;
    
    try {
      const data = await productionApi.getByFactory(factoryId);
      setProductionRecords(data || []);
    } catch (error) {
      console.error('Error loading production records:', error);
      toast({ title: "Error", description: "Failed to load production records", variant: "destructive" });
    }
  };

  const getProductType = (productId: string) => {
    return productTypes.find(pt => pt.id === productId);
  };

  const calculateExpected = (punches: number, productId: string) => {
    const productType = getProductType(productId);
    return productType?.items_per_punch ? punches * productType.items_per_punch : 0;
  };

  const calculateEfficiency = (actual: number, expected: number) => {
    return expected > 0 ? (actual / expected) * 100 : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryId) return;
    
    console.log('=== PRODUCTION FORM SUBMIT ===');
    console.log('formData:', formData);
    console.log('product_id:', formData.product_id);
    console.log('productTypes list:', productTypes);
    
    const productType = getProductType(formData.product_id);
    
    try {
      // CRITICAL VALIDATION: Ensure product_id is not empty
      if (!formData.product_id || formData.product_id.trim() === '') {
        console.error('VALIDATION FAILED: No product selected');
        toast({ title: "Error", description: "Please select a product type from the dropdown", variant: "destructive" });
        return;
      }
      
      const productionData = {
        date: formData.date,
        product_id: formData.product_id,
        product_name: productType?.name || '',
        punches: parseInt(formData.punches) || undefined,
        quantity: parseInt(formData.quantity),
        remarks: formData.remarks || undefined,
        factory_id: factoryId
      };

      if (editingRecord) {
        await productionApi.update(editingRecord.id, productionData);
        toast({ title: "Success", description: "Production record updated successfully" });
      } else {
        await productionApi.create(productionData);
        toast({ title: "Success", description: "Production record added successfully" });
      }

      resetForm();
      await loadProductionRecords();
    } catch (error) {
      console.error('Error saving production record:', error);
      toast({ title: "Error", description: "Failed to save production record", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      product_id: productTypes.length > 0 ? productTypes[0].id : '',
      punches: '',
      quantity: '',
      remarks: ''
    });
    setEditingRecord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (record: ProductionLog) => {
    setEditingRecord(record);
    setFormData({
      date: record.date || new Date().toISOString().split('T')[0],
      product_id: record.product_id,
      punches: record.punches?.toString() || '',
      quantity: record.quantity.toString(),
      remarks: record.remarks || ''
    });
    setIsDialogOpen(true);
  };

  const [deleteDialogState, setDeleteDialogState] = useState<{open: boolean, id: string}>({
    open: false,
    id: ''
  });

  const handleDelete = async (id: string) => {
    try {
      await productionApi.delete(id);
      toast({ title: "Success", description: "Production record deleted successfully" });
      // Immediately update local state
      setProductionRecords(prev => prev.filter(r => r.id !== id));
      // Also refresh from server
      await loadProductionRecords();
    } catch (error) {
      console.error('Error deleting production record:', error);
      toast({ title: "Error", description: "Failed to delete production record", variant: "destructive" });
    }
    setDeleteDialogState({open: false, id: ''});
  };

  const expectedBricks = formData.punches && formData.product_id ? 
    calculateExpected(parseInt(formData.punches), formData.product_id) : 0;

  // Calculate totals per product type
  const productionByType = productTypes.map(pt => ({
    ...pt,
    totalProduced: productionRecords
      .filter(r => r.product_id === pt.id)
      .reduce((sum, r) => sum + r.quantity, 0)
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Production Management</h1>
            <p className="text-muted-foreground">Track and manage production efficiency</p>
          </div>
          
          <Button className="btn-orange" onClick={handleAddClick} disabled={isReadOnly}>
            {isReadOnly && <Lock className="h-4 w-4 mr-2" />}
            <Plus className="h-4 w-4 mr-2" />
            Add Production
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-primary">{editingRecord ? 'Edit' : 'Add'} Production</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Product Type</label>
                  <Select value={formData.product_id} onValueChange={(value) => setFormData({...formData, product_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map(pt => (
                        <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Punches</label>
                  <Input
                    type="number"
                    value={formData.punches}
                    onChange={(e) => setFormData({...formData, punches: e.target.value})}
                    placeholder="Number of punches"
                  />
                  {expectedBricks > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Expected: {expectedBricks} pieces
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Actual Quantity</label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                    placeholder="Actual pieces produced"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Remarks (Optional)</label>
                  <Input
                    value={formData.remarks}
                    onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                    placeholder="Any notes..."
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" className="btn-orange">Save</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productionByType.map(pt => (
            <div key={pt.id} className="card-stat">
              <Factory className="h-8 w-8 text-primary mb-2" />
              <p className="text-sm text-muted-foreground">{pt.name}</p>
              <p className="text-3xl font-bold text-foreground">{pt.totalProduced.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{pt.unit}</p>
            </div>
          ))}
        </div>

        {/* Production Records Table */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Production Records</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Product</th>
                  <th className="text-right py-3 px-4">Punches</th>
                  <th className="text-right py-3 px-4">Quantity</th>
                  <th className="text-right py-3 px-4">Efficiency</th>
                  <th className="text-left py-3 px-4">Remarks</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productionRecords.map(record => {
                  const expected = calculateExpected(record.punches || 0, record.product_id);
                  const efficiency = calculateEfficiency(record.quantity, expected);
                  
                  return (
                    <tr key={record.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">{new Date(record.date || '').toLocaleDateString()}</td>
                      <td className="py-3 px-4">{record.product_name}</td>
                      <td className="py-3 px-4 text-right">{record.punches || '-'}</td>
                      <td className="py-3 px-4 text-right">{record.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={efficiency >= 100 ? 'text-success' : efficiency >= 90 ? 'text-warning' : 'text-destructive'}>
                          {efficiency > 0 ? `${efficiency.toFixed(1)}%` : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{record.remarks || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(record)} disabled={isReadOnly}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setDeleteDialogState({open: true, id: record.id})}
                            disabled={isReadOnly}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogState.open} onOpenChange={(open) => setDeleteDialogState({...deleteDialogState, open})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this production record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialogState.id)} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProductionModule;

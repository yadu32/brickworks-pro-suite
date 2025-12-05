import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Factory, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductDefinition {
  id: string;
  name: string;
  unit: string;
  items_per_punch: number | null;
  size_description: string | null;
  factory_id: string;
}

interface ProductionRecord {
  id: string;
  date: string;
  product_id: string;
  product_name: string;
  punches: number;
  quantity: number;
  remarks: string;
  factory_id: string;
}

const ProductionModule = () => {
  const { toast } = useToast();
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [productTypes, setProductTypes] = useState<ProductDefinition[]>([]);
  const [factoryId, setFactoryId] = useState<string | null>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    product_id: '',
    punches: '',
    quantity: '',
    remarks: ''
  });

  useEffect(() => {
    loadFactoryId();
  }, []);

  useEffect(() => {
    if (factoryId) {
      loadProductTypes();
      loadProductionRecords();
    }
  }, [factoryId]);

  const loadFactoryId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: factory } = await supabase
      .from('factories')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();
    
    if (factory) {
      setFactoryId(factory.id);
    }
  };

  const loadProductTypes = async () => {
    if (!factoryId) return;
    
    try {
      const { data, error } = await supabase
        .from('product_definitions')
        .select('*')
        .eq('factory_id', factoryId);
      
      if (error) throw error;
      setProductTypes(data || []);
      if (data && data.length > 0 && !formData.product_id) {
        setFormData(prev => ({ ...prev, product_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading product types:', error);
      toast({ title: "Error", description: "Failed to load product types", variant: "destructive" });
    }
  };

  const loadProductionRecords = async () => {
    if (!factoryId) return;
    
    try {
      const { data, error } = await supabase
        .from('production_logs')
        .select('*')
        .eq('factory_id', factoryId)
        .order('date', { ascending: false });
      
      if (error) throw error;
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
    
    const productType = getProductType(formData.product_id);
    
    try {
      const productionData = {
        date: formData.date,
        product_id: formData.product_id,
        product_name: productType?.name || '',
        punches: parseInt(formData.punches),
        quantity: parseInt(formData.quantity),
        remarks: formData.remarks,
        factory_id: factoryId
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('production_logs')
          .update(productionData)
          .eq('id', editingRecord.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Production record updated successfully" });
      } else {
        const { error } = await supabase
          .from('production_logs')
          .insert([productionData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Production record added successfully" });
      }

      resetForm();
      loadProductionRecords();
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

  const handleEdit = (record: ProductionRecord) => {
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
      const { error } = await supabase.from('production_logs').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: "Success", description: "Production record deleted successfully" });
      // Immediately update local state to remove the deleted record
      setProductionRecords(prev => prev.filter(r => r.id !== id));
      // Also refresh from server to ensure consistency
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
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-orange">
                <Plus className="h-4 w-4 mr-2" />
                Add Production
              </Button>
            </DialogTrigger>
            <DialogContent className="card-dark max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingRecord ? 'Edit Production Entry' : 'New Production Entry'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-label">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="input-dark"
                    required
                  />
                </div>

                <div>
                  <label className="text-label">Product Type</label>
                  <Select value={formData.product_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, product_id: value }))
                  }>
                    <SelectTrigger className="input-dark">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent className="card-dark">
                      {productTypes.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No products defined. Add in Settings.
                        </SelectItem>
                      ) : (
                        productTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} {type.items_per_punch && `(${type.items_per_punch} per punch)`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-label">Number of Punches</label>
                  <Input
                    type="number"
                    value={formData.punches}
                    onChange={(e) => setFormData(prev => ({ ...prev, punches: e.target.value }))}
                    className="input-dark"
                    min="1"
                    required
                  />
                  {expectedBricks > 0 && (
                    <p className="text-secondary mt-1">Expected: {expectedBricks}</p>
                  )}
                </div>

                <div>
                  <label className="text-label">Actual Quantity Produced</label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                    className="input-dark"
                    min="0"
                    required
                  />
                  {formData.quantity && expectedBricks > 0 && (
                    <p className={`mt-1 font-medium ${
                      calculateEfficiency(parseInt(formData.quantity), expectedBricks) >= 95 ? 'text-success' :
                      calculateEfficiency(parseInt(formData.quantity), expectedBricks) >= 85 ? 'text-warning' : 'text-destructive'
                    }`}>
                      Efficiency: {calculateEfficiency(parseInt(formData.quantity), expectedBricks).toFixed(1)}%
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-label">Remarks</label>
                  <Input
                    value={formData.remarks}
                    onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                    className="input-dark"
                    placeholder="Optional remarks"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button type="submit" className="btn-orange flex-1" disabled={!formData.product_id}>
                    {editingRecord ? 'Update' : 'Add'} Record
                  </Button>
                  <Button type="button" onClick={resetForm} variant="secondary" className="flex-1">
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Production Summary by Type */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productionByType.length === 0 ? (
            <div className="col-span-full card-dark p-8 text-center">
              <Factory className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No product types defined yet. Add them in Settings.</p>
            </div>
          ) : (
            productionByType.map((pt, index) => (
              <div key={pt.id} className="card-metric">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary">{pt.name}</p>
                    <p className="text-metric text-primary">{pt.totalProduced.toLocaleString()}</p>
                    <p className="text-secondary">{pt.unit}</p>
                  </div>
                  <Factory className={`h-12 w-12 ${index % 2 === 0 ? 'text-primary' : 'text-success'}`} />
                </div>
              </div>
            ))
          )}
        </section>

        {/* Production Records */}
        <section className="card-dark p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Production Records</h2>
          
          <div className="space-y-4">
            {productionRecords.length === 0 ? (
              <div className="text-center py-8">
                <Factory className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No production records yet</p>
              </div>
            ) : (
              productionRecords.map((record) => {
                const productType = getProductType(record.product_id);
                const expected = productType?.items_per_punch 
                  ? (record.punches || 0) * productType.items_per_punch 
                  : 0;
                const efficiency = expected > 0 ? (record.quantity / expected) * 100 : 0;
                
                return (
                  <div key={record.id} className="card-dark p-4 border border-border">
                    <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground font-medium">{record.date}</span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                            {record.product_name}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-secondary">Punches</p>
                            <p className="text-foreground font-medium">{record.punches || '-'}</p>
                          </div>
                          <div>
                            <p className="text-secondary">Expected</p>
                            <p className="text-foreground font-medium">{expected || '-'}</p>
                          </div>
                          <div>
                            <p className="text-secondary">Actual</p>
                            <p className="text-foreground font-medium">{record.quantity}</p>
                          </div>
                          <div>
                            <p className="text-secondary">Efficiency</p>
                            <p className={`font-medium ${
                              efficiency >= 95 ? 'text-success' : 
                              efficiency >= 85 ? 'text-warning' : 'text-destructive'
                            }`}>
                              {expected > 0 ? `${efficiency.toFixed(1)}%` : '-'}
                            </p>
                          </div>
                        </div>
                        
                        {record.remarks && (
                          <p className="text-secondary text-sm mt-2">{record.remarks}</p>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(record)}
                          className="hover:bg-primary/20"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteDialogState({open: true, id: record.id})}
                          className="hover:bg-destructive/20 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogState.open} onOpenChange={(open) => setDeleteDialogState({...deleteDialogState, open})}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this production record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDelete(deleteDialogState.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ProductionModule;
import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Factory, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProductionRecord {
  id: string;
  date: string;
  brick_type_id: string;
  brickTypeName: string;
  number_of_punches: number;
  actual_bricks_produced: number;
  remarks: string;
  efficiency: number;
}

const ProductionModule = () => {
  const { toast } = useToast();
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [brickTypes, setBrickTypes] = useState<any[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    brick_type_id: '',
    number_of_punches: '',
    actual_bricks_produced: '',
    remarks: ''
  });

  useEffect(() => {
    loadBrickTypes();
    loadProductionRecords();
  }, []);

  const loadBrickTypes = async () => {
    try {
      const { data, error } = await supabase.from('brick_types').select('*').eq('is_active', true);
      if (error) throw error;
      setBrickTypes(data || []);
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, brick_type_id: data[0].id }));
      }
    } catch (error) {
      console.error('Error loading brick types:', error);
      toast({ title: "Error", description: "Failed to load brick types", variant: "destructive" });
    }
  };

  const loadProductionRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('bricks_production')
        .select(`
          *,
          brick_types (
            id,
            type_name,
            standard_bricks_per_punch
          )
        `)
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      const formattedRecords = data?.map(record => ({
        id: record.id,
        date: record.date,
        brick_type_id: record.brick_type_id,
        brickTypeName: record.brick_types?.type_name || '',
        number_of_punches: record.number_of_punches,
        actual_bricks_produced: record.actual_bricks_produced,
        remarks: record.remarks || '',
        efficiency: record.brick_types?.standard_bricks_per_punch 
          ? (record.actual_bricks_produced / (record.number_of_punches * record.brick_types.standard_bricks_per_punch)) * 100
          : 0
      })) || [];
      
      setProductionRecords(formattedRecords);
    } catch (error) {
      console.error('Error loading production records:', error);
      toast({ title: "Error", description: "Failed to load production records", variant: "destructive" });
    }
  };

  const calculateExpected = (punches: number, brickTypeId: string) => {
    const brickType = brickTypes.find(bt => bt.id === brickTypeId);
    return brickType ? punches * brickType.standard_bricks_per_punch : 0;
  };

  const calculateEfficiency = (actual: number, expected: number) => {
    return expected > 0 ? (actual / expected) * 100 : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productionData = {
        date: formData.date,
        brick_type_id: formData.brick_type_id,
        number_of_punches: parseInt(formData.number_of_punches),
        actual_bricks_produced: parseInt(formData.actual_bricks_produced),
        remarks: formData.remarks
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('bricks_production')
          .update(productionData)
          .eq('id', editingRecord.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Production record updated successfully" });
      } else {
        const { error } = await supabase
          .from('bricks_production')
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
      brick_type_id: brickTypes.length > 0 ? brickTypes[0].id : '',
      number_of_punches: '',
      actual_bricks_produced: '',
      remarks: ''
    });
    setEditingRecord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (record: ProductionRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      brick_type_id: record.brick_type_id,
      number_of_punches: record.number_of_punches.toString(),
      actual_bricks_produced: record.actual_bricks_produced.toString(),
      remarks: record.remarks
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('bricks_production').delete().eq('id', id);
      if (error) throw error;
      
      toast({ title: "Success", description: "Production record deleted successfully" });
      loadProductionRecords();
    } catch (error) {
      console.error('Error deleting production record:', error);
      toast({ title: "Error", description: "Failed to delete production record", variant: "destructive" });
    }
  };

  const expectedBricks = formData.number_of_punches && formData.brick_type_id ? 
    calculateExpected(parseInt(formData.number_of_punches), formData.brick_type_id) : 0;

  // Calculate totals
  const fourInchType = brickTypes.find(bt => bt.type_name.toLowerCase().includes('4-inch') || bt.type_name.toLowerCase().includes('4 inch'));
  const sixInchType = brickTypes.find(bt => bt.type_name.toLowerCase().includes('6-inch') || bt.type_name.toLowerCase().includes('6 inch'));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Production Management</h1>
            <p className="text-muted-foreground">Track and manage brick production efficiency</p>
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
                  {editingRecord ? 'Edit Production Record' : 'Add Production Record'}
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
                  <label className="text-label">Brick Type</label>
                  <Select value={formData.brick_type_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, brick_type_id: value }))
                  }>
                    <SelectTrigger className="input-dark">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="card-dark">
                      {brickTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.type_name} ({type.standard_bricks_per_punch} per punch)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-label">Number of Punches</label>
                  <Input
                    type="number"
                    value={formData.number_of_punches}
                    onChange={(e) => setFormData(prev => ({ ...prev, number_of_punches: e.target.value }))}
                    className="input-dark"
                    min="1"
                    required
                  />
                  {expectedBricks > 0 && (
                    <p className="text-secondary mt-1">Expected: {expectedBricks} bricks</p>
                  )}
                </div>

                <div>
                  <label className="text-label">Actual Bricks Produced</label>
                  <Input
                    type="number"
                    value={formData.actual_bricks_produced}
                    onChange={(e) => setFormData(prev => ({ ...prev, actual_bricks_produced: e.target.value }))}
                    className="input-dark"
                    min="0"
                    required
                  />
                  {formData.actual_bricks_produced && expectedBricks > 0 && (
                    <p className="text-secondary mt-1">
                      Efficiency: {calculateEfficiency(parseInt(formData.actual_bricks_produced), expectedBricks).toFixed(1)}%
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
                  <Button type="submit" className="btn-orange flex-1">
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

        {/* All-Time Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary">Total 4-inch Production</p>
                <p className="text-metric text-primary">{productionRecords.filter(r => r.brick_type_id === fourInchType?.id).reduce((sum, r) => sum + r.actual_bricks_produced, 0).toLocaleString()}</p>
                <p className="text-secondary">pieces</p>
              </div>
              <Factory className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="card-metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary">Total 6-inch Production</p>
                <p className="text-metric text-success">{productionRecords.filter(r => r.brick_type_id === sixInchType?.id).reduce((sum, r) => sum + r.actual_bricks_produced, 0).toLocaleString()}</p>
                <p className="text-secondary">pieces</p>
              </div>
              <Factory className="h-12 w-12 text-success" />
            </div>
          </div>
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
              productionRecords.map((record) => (
                <div key={record.id} className="card-dark p-4 border border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{record.date}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.brickTypeName.includes('4-inch') 
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-success/20 text-success border border-success/30'
                        }`}>
                          {record.brickTypeName}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-secondary">Punches</p>
                          <p className="text-foreground font-medium">{record.number_of_punches}</p>
                        </div>
                        <div>
                          <p className="text-secondary">Expected</p>
                          <p className="text-foreground font-medium">{calculateExpected(record.number_of_punches, record.brick_type_id)}</p>
                        </div>
                        <div>
                          <p className="text-secondary">Actual</p>
                          <p className="text-foreground font-medium">{record.actual_bricks_produced}</p>
                        </div>
                        <div>
                          <p className="text-secondary">Efficiency</p>
                          <p className={`font-medium ${
                            record.efficiency >= 95 ? 'text-success' : 
                            record.efficiency >= 85 ? 'text-warning' : 'text-destructive'
                          }`}>
                            {record.efficiency.toFixed(1)}%
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
                        onClick={() => handleDelete(record.id)}
                        className="hover:bg-destructive/20 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductionModule;
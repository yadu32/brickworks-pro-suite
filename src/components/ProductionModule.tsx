import { useState } from 'react';
import { Plus, Edit3, Trash2, Factory, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ProductionRecord {
  id: string;
  date: string;
  brickType: '4-inch' | '6-inch';
  numberOfPunches: number;
  expectedBricks: number;
  actualBricksProduced: number;
  remarks: string;
  efficiency: number;
}

const ProductionModule = () => {
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([
    {
      id: '1',
      date: '2024-01-15',
      brickType: '4-inch',
      numberOfPunches: 15,
      expectedBricks: 120,
      actualBricksProduced: 118,
      remarks: 'Slight machine adjustment needed',
      efficiency: 98.3
    },
    {
      id: '2',
      date: '2024-01-15',
      brickType: '6-inch',
      numberOfPunches: 12,
      expectedBricks: 60,
      actualBricksProduced: 58,
      remarks: 'Material quality excellent',
      efficiency: 96.7
    },
    {
      id: '3',
      date: '2024-01-14',
      brickType: '4-inch',
      numberOfPunches: 18,
      expectedBricks: 144,
      actualBricksProduced: 142,
      remarks: 'Normal production',
      efficiency: 98.6
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    brickType: '4-inch' as '4-inch' | '6-inch',
    numberOfPunches: '',
    actualBricksProduced: '',
    remarks: ''
  });

  const brickTypes = {
    '4-inch': { standardPerPunch: 8, unit: 'pieces' },
    '6-inch': { standardPerPunch: 5, unit: 'pieces' }
  };

  const calculateExpected = (punches: number, type: '4-inch' | '6-inch') => {
    return punches * brickTypes[type].standardPerPunch;
  };

  const calculateEfficiency = (actual: number, expected: number) => {
    return expected > 0 ? (actual / expected) * 100 : 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const punches = parseInt(formData.numberOfPunches);
    const actual = parseInt(formData.actualBricksProduced);
    const expected = calculateExpected(punches, formData.brickType);
    
    const newRecord: ProductionRecord = {
      id: editingRecord?.id || Date.now().toString(),
      date: formData.date,
      brickType: formData.brickType,
      numberOfPunches: punches,
      expectedBricks: expected,
      actualBricksProduced: actual,
      remarks: formData.remarks,
      efficiency: calculateEfficiency(actual, expected)
    };

    if (editingRecord) {
      setProductionRecords(prev => 
        prev.map(record => record.id === editingRecord.id ? newRecord : record)
      );
    } else {
      setProductionRecords(prev => [newRecord, ...prev]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      brickType: '4-inch',
      numberOfPunches: '',
      actualBricksProduced: '',
      remarks: ''
    });
    setEditingRecord(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (record: ProductionRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date,
      brickType: record.brickType,
      numberOfPunches: record.numberOfPunches.toString(),
      actualBricksProduced: record.actualBricksProduced.toString(),
      remarks: record.remarks
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProductionRecords(prev => prev.filter(record => record.id !== id));
  };

  const expectedBricks = formData.numberOfPunches ? 
    calculateExpected(parseInt(formData.numberOfPunches), formData.brickType) : 0;

  // Calculate totals
  const todayRecords = productionRecords.filter(r => r.date === new Date().toISOString().split('T')[0]);
  const todayTotals = {
    '4-inch': todayRecords.filter(r => r.brickType === '4-inch').reduce((sum, r) => sum + r.actualBricksProduced, 0),
    '6-inch': todayRecords.filter(r => r.brickType === '6-inch').reduce((sum, r) => sum + r.actualBricksProduced, 0)
  };

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
                  <Select value={formData.brickType} onValueChange={(value: '4-inch' | '6-inch') => 
                    setFormData(prev => ({ ...prev, brickType: value }))
                  }>
                    <SelectTrigger className="input-dark">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="card-dark">
                      <SelectItem value="4-inch">4-inch Brick (8 per punch)</SelectItem>
                      <SelectItem value="6-inch">6-inch Brick (5 per punch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-label">Number of Punches</label>
                  <Input
                    type="number"
                    value={formData.numberOfPunches}
                    onChange={(e) => setFormData(prev => ({ ...prev, numberOfPunches: e.target.value }))}
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
                    value={formData.actualBricksProduced}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualBricksProduced: e.target.value }))}
                    className="input-dark"
                    min="0"
                    required
                  />
                  {formData.actualBricksProduced && expectedBricks > 0 && (
                    <p className="text-secondary mt-1">
                      Efficiency: {calculateEfficiency(parseInt(formData.actualBricksProduced), expectedBricks).toFixed(1)}%
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

        {/* Today's Summary */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary">Today's 4-inch Production</p>
                <p className="text-metric text-primary">{todayTotals['4-inch'].toLocaleString()}</p>
                <p className="text-secondary">pieces</p>
              </div>
              <Factory className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="card-metric">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-secondary">Today's 6-inch Production</p>
                <p className="text-metric text-success">{todayTotals['6-inch'].toLocaleString()}</p>
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
                          record.brickType === '4-inch' 
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-success/20 text-success border border-success/30'
                        }`}>
                          {record.brickType}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-secondary">Punches</p>
                          <p className="text-foreground font-medium">{record.numberOfPunches}</p>
                        </div>
                        <div>
                          <p className="text-secondary">Expected</p>
                          <p className="text-foreground font-medium">{record.expectedBricks}</p>
                        </div>
                        <div>
                          <p className="text-secondary">Actual</p>
                          <p className="text-foreground font-medium">{record.actualBricksProduced}</p>
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
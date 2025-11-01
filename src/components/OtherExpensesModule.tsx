import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, TrendingDown, DollarSign } from 'lucide-react';

interface OtherExpense {
  id: string;
  date: string;
  expense_type: string;
  description: string;
  amount: number;
  vendor_name: string | null;
  receipt_number: string | null;
  notes: string | null;
}

const OtherExpensesModule = () => {
  const [expenses, setExpenses] = useState<OtherExpense[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    expense_type: 'miscellaneous',
    description: '',
    amount: '',
    vendor_name: '',
    receipt_number: '',
    notes: ''
  });

  const expenseTypes = [
    { value: 'transport', label: 'Transport' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'office_salaries', label: 'Office Salaries' },
    { value: 'repairs', label: 'Repairs' },
    { value: 'miscellaneous', label: 'Miscellaneous' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const loadExpenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('other_expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      toast({ title: 'Error loading expenses', description: error.message, variant: 'destructive' });
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('other_expenses').insert([{
      date: formData.date,
      expense_type: formData.expense_type,
      description: formData.description,
      amount: parseFloat(formData.amount),
      vendor_name: formData.vendor_name || null,
      receipt_number: formData.receipt_number || null,
      notes: formData.notes || null
    }]);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Expense added successfully' });
      setFormData({
        date: new Date().toISOString().split('T')[0],
        expense_type: 'miscellaneous',
        description: '',
        amount: '',
        vendor_name: '',
        receipt_number: '',
        notes: ''
      });
      setIsDialogOpen(false);
      loadExpenses();
    }
    setLoading(false);
  };

  const [deleteDialogState, setDeleteDialogState] = useState<{open: boolean, id: string}>({
    open: false,
    id: ''
  });

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('other_expenses').delete().eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Expense deleted' });
      loadExpenses();
    }
    setDeleteDialogState({open: false, id: ''});
  };

  const getTotalByType = () => {
    const totals: Record<string, number> = {};
    expenses.forEach(exp => {
      totals[exp.expense_type] = (totals[exp.expense_type] || 0) + exp.amount;
    });
    return totals;
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expenseTotals = getTotalByType();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-foreground">Other Expenses</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Expense Type</Label>
                  <Select value={formData.expense_type} onValueChange={(value) => setFormData({ ...formData, expense_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the expense"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Vendor Name</Label>
                  <Input
                    value={formData.vendor_name}
                    onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <Label>Receipt Number</Label>
                <Input
                  value={formData.receipt_number}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>Add Expense</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-lg">
              <TrendingDown className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalExpenses)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground">
                {formatCurrency(
                  expenses
                    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
                    .reduce((sum, e) => sum + e.amount, 0)
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Expense Breakdown by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {expenseTypes.map(type => (
            <div key={type.value} className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{type.label}</p>
              <p className="text-lg font-semibold text-foreground">
                {formatCurrency(expenseTotals[type.value] || 0)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-foreground">Recent Expenses</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Receipt #</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 bg-muted rounded text-xs">
                      {expenseTypes.find(t => t.value === expense.expense_type)?.label}
                    </span>
                  </TableCell>
                  <TableCell>{expense.description}</TableCell>
                  <TableCell>{expense.vendor_name || '-'}</TableCell>
                  <TableCell>{expense.receipt_number || '-'}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialogState({open: true, id: expense.id})}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogState.open} onOpenChange={(open) => setDeleteDialogState({...deleteDialogState, open})}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteExpense(deleteDialogState.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OtherExpensesModule;
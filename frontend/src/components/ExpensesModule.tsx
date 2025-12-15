import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, TrendingDown, Receipt, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AddEmployeeDialog } from '@/components/AddEmployeeDialog';
import { useFactory } from '@/hooks/useFactory';
import { employeeApi, expenseApi } from '@/api';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';

interface EmployeePayment {
  id: string;
  date: string;
  employee_name: string;
  amount: number;
  payment_type: string;
  notes: string;
}

interface EmployeeSummary {
  employee_name: string;
  total_amount: number;
  payment_count: number;
  latest_payment: string;
}

interface OtherExpense {
  id: string;
  date: string;
  expense_type: string;
  description: string;
  amount: number;
  vendor_name: string | null;
  receipt_number: string | null;
  notes: string | null;
  factory_id: string;
}

const ExpensesModule = () => {
  // Payment states
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<Array<{ value: string; label: string }>>([]);
  
  // Expense states
  const [expenses, setExpenses] = useState<OtherExpense[]>([]);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  
  // Common states
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const { toast } = useToast();
  const { factoryId: hookFactoryId } = useFactory();
  const { guardAction, isReadOnly } = useSubscriptionGuard();

  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    employee_name: '',
    amount: '',
    payment_type: '',
    notes: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    expense_type: 'miscellaneous',
    description: '',
    amount: '',
    vendor_name: '',
    receipt_number: '',
    notes: ''
  });

  const paymentTypes = ['Salary', 'Advance', 'Bonus', 'Incentive'];
  const expenseTypes = [
    { value: 'transport', label: 'Transport' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'office_salaries', label: 'Office Salaries' },
    { value: 'repairs', label: 'Repairs' },
    { value: 'miscellaneous', label: 'Miscellaneous' }
  ];

  useEffect(() => {
    if (hookFactoryId) {
      setFactoryId(hookFactoryId);
    }
  }, [hookFactoryId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Load Payments
  const loadPayments = async () => {
    if (!factoryId) return;
    
    try {
      const data = await employeeApi.getPayments(factoryId);
      setPayments(data || []);
    } catch (error: any) {
      console.error('Error loading payments:', error);
      toast({ title: 'Error loading payments', description: error.response?.data?.detail || 'Failed to load', variant: 'destructive' });
    }
  };

  // Load Employee Names for dropdown
  const loadEmployeeNames = async () => {
    if (!factoryId) return;
    
    try {
      const data = await employeeApi.getByFactory(factoryId);
      const options = data?.map(emp => ({
        value: emp.name,
        label: emp.name
      })) || [];
      
      setEmployeeOptions(options);
    } catch (error) {
      console.error('Error loading employees', error);
      setEmployeeOptions([]);
    }
  };

  // Load Expenses
  const loadExpenses = async () => {
    if (!factoryId) return;
    
    try {
      const data = await expenseApi.getOtherExpenses(factoryId);
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error loading expenses:', error);
      toast({ title: 'Error loading expenses', description: error.response?.data?.detail || 'Failed to load expenses', variant: 'destructive' });
    }
  };

  // Calculate Employee Summaries from payments
  const calculateEmployeeSummaries = (paymentsData: EmployeePayment[]) => {
    const employeeMap = new Map<string, EmployeeSummary>();
    
    paymentsData.forEach(payment => {
      const key = payment.employee_name.toLowerCase();
      if (!employeeMap.has(key)) {
        employeeMap.set(key, {
          employee_name: payment.employee_name,
          total_amount: 0,
          payment_count: 0,
          latest_payment: payment.date
        });
      }
      
      const employee = employeeMap.get(key)!;
      employee.total_amount += payment.amount;
      employee.payment_count += 1;
      
      if (payment.date > employee.latest_payment) {
        employee.latest_payment = payment.date;
      }
    });
    
    setEmployees(Array.from(employeeMap.values()).sort((a, b) => b.total_amount - a.total_amount));
  };

  useEffect(() => {
    if (factoryId) {
      loadPayments();
      loadExpenses();
    }
  }, [factoryId]);

  useEffect(() => {
    if (payments.length > 0) {
      calculateEmployeeSummaries(payments);
    }
  }, [payments]);

  // Calculate monthly totals
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyPayments = payments
    .filter(p => {
      const date = new Date(p.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const monthlyExpenses = expenses
    .filter(e => {
      const date = new Date(e.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Handle Payment Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryId) return;

    try {
      const paymentData = {
        date: paymentForm.date,
        employee_name: paymentForm.employee_name,
        amount: Number(paymentForm.amount),
        payment_type: paymentForm.payment_type,
        notes: paymentForm.notes,
        factory_id: factoryId
      };

      await employeeApi.createPayment(paymentData);
      
      toast({ title: 'Success', description: 'Payment added successfully' });
      setPaymentForm({
        date: new Date().toISOString().split('T')[0],
        employee_name: '',
        amount: '',
        payment_type: '',
        notes: ''
      });
      setIsPaymentDialogOpen(false);
      await loadPayments();
      await loadEmployees();
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to add payment', 
        variant: 'destructive' 
      });
    }
  };

  // Handle Expense Submit
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryId) return;

    try {
      const expenseData = {
        date: expenseForm.date,
        expense_type: expenseForm.expense_type,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        vendor_name: expenseForm.vendor_name || undefined,
        receipt_number: expenseForm.receipt_number || undefined,
        notes: expenseForm.notes || undefined,
        factory_id: factoryId
      };

      await expenseApi.createOtherExpense(expenseData);
      
      toast({ title: 'Success', description: 'Expense added successfully' });
      setExpenseForm({
        date: new Date().toISOString().split('T')[0],
        expense_type: 'miscellaneous',
        description: '',
        amount: '',
        vendor_name: '',
        receipt_number: '',
        notes: ''
      });
      setIsExpenseDialogOpen(false);
      await loadExpenses();
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to add expense. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  // Delete Expense
  const deleteExpense = async (id: string) => {
    try {
      await expenseApi.deleteOtherExpense(id);
      toast({ title: 'Success', description: 'Expense deleted successfully' });
      await loadExpenses();
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to delete expense', 
        variant: 'destructive' 
      });
    }
  };

  const handleAddPaymentClick = () => {
    guardAction(() => {
      if (employeeOptions.length > 0 && !paymentForm.employee_name) {
        setPaymentForm(prev => ({ ...prev, employee_name: employeeOptions[0].value }));
      }
      setIsPaymentDialogOpen(true);
    });
  };

  const handleAddExpenseClick = () => {
    guardAction(() => {
      setIsExpenseDialogOpen(true);
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Two Buttons (like Materials page) */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          <div className="flex gap-3">
            <Button onClick={handleAddPaymentClick} disabled={isReadOnly} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
            <Button onClick={handleAddExpenseClick} disabled={isReadOnly} className="btn-secondary">
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </div>
        </div>

        {/* Monthly Summary Card (Two metrics side-by-side) */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-primary" />
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-warning/10 rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm font-medium mb-2">Monthly Payments</p>
                <p className="text-4xl font-bold text-warning">{formatCurrency(monthlyPayments)}</p>
                <p className="text-xs text-muted-foreground mt-1">Labor Cost</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-6 text-center">
                <p className="text-muted-foreground text-sm font-medium mb-2">Monthly Expenses</p>
                <p className="text-4xl font-bold text-destructive">{formatCurrency(monthlyExpenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">Operational Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Summary Table (Keep as is) */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-success" />
              Employee Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-secondary">Employee</TableHead>
                    <TableHead className="text-secondary text-right">Total Paid</TableHead>
                    <TableHead className="text-secondary text-right">Payments</TableHead>
                    <TableHead className="text-secondary text-right">Last Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No employee data available
                      </TableCell>
                    </TableRow>
                  ) : (
                    employees.map((emp) => (
                      <TableRow key={emp.employee_name} className="border-border">
                        <TableCell className="text-foreground font-medium">{emp.employee_name}</TableCell>
                        <TableCell className="text-right text-success font-semibold">
                          {formatCurrency(emp.total_amount)}
                        </TableCell>
                        <TableCell className="text-right text-foreground">{emp.payment_count}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {new Date(emp.latest_payment).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Expenses Table (Replaced Recent Payments) */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-destructive" />
              Recent Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="text-secondary">Date</TableHead>
                    <TableHead className="text-secondary">Type</TableHead>
                    <TableHead className="text-secondary">Description</TableHead>
                    <TableHead className="text-secondary text-right">Amount</TableHead>
                    <TableHead className="text-secondary text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No expenses recorded
                      </TableCell>
                    </TableRow>
                  ) : (
                    expenses.slice(0, 10).map((expense) => (
                      <TableRow key={expense.id} className="border-border">
                        <TableCell className="text-foreground">
                          {new Date(expense.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-foreground capitalize">
                          {expense.expense_type.replace('_', ' ')}
                        </TableCell>
                        <TableCell className="text-foreground">{expense.description}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteExpenseId(expense.id)}
                            disabled={isReadOnly}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="modal-content">
            <DialogHeader>
              <DialogTitle>Add Employee Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="employee">Employee Name</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddEmployeeOpen(true)}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add New
                  </Button>
                </div>
                <SearchableSelect
                  value={paymentForm.employee_name}
                  onValueChange={(value) => setPaymentForm({...paymentForm, employee_name: value})}
                  options={employeeOptions}
                  placeholder="Select employee..."
                  searchPlaceholder="Search employees..."
                />
              </div>
              <div>
                <Label htmlFor="payment_type">Payment Type</Label>
                <Select
                  value={paymentForm.payment_type}
                  onValueChange={(value) => setPaymentForm({...paymentForm, payment_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 btn-primary">
                  Add Payment
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Expense Dialog */}
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogContent className="modal-content">
            <DialogHeader>
              <DialogTitle>Add Other Expense</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <Label htmlFor="expense_date">Date</Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expense_type">Type</Label>
                <Select
                  value={expenseForm.expense_type}
                  onValueChange={(value) => setExpenseForm({...expenseForm, expense_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  placeholder="Brief description"
                  required
                />
              </div>
              <div>
                <Label htmlFor="expense_amount">Amount (₹)</Label>
                <Input
                  id="expense_amount"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vendor">Vendor Name (Optional)</Label>
                <Input
                  id="vendor"
                  value={expenseForm.vendor_name}
                  onChange={(e) => setExpenseForm({...expenseForm, vendor_name: e.target.value})}
                  placeholder="Vendor name"
                />
              </div>
              <div>
                <Label htmlFor="receipt">Receipt Number (Optional)</Label>
                <Input
                  id="receipt"
                  value={expenseForm.receipt_number}
                  onChange={(e) => setExpenseForm({...expenseForm, receipt_number: e.target.value})}
                  placeholder="Receipt number"
                />
              </div>
              <div>
                <Label htmlFor="expense_notes">Notes</Label>
                <Textarea
                  id="expense_notes"
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 btn-primary">
                  Add Expense
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsExpenseDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Employee Dialog */}
        <AddEmployeeDialog
          open={isAddEmployeeOpen}
          onOpenChange={setIsAddEmployeeOpen}
          onEmployeeAdded={loadEmployees}
        />

        {/* Delete Expense Confirmation */}
        <AlertDialog open={!!deleteExpenseId} onOpenChange={() => setDeleteExpenseId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this expense record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteExpenseId) deleteExpense(deleteExpenseId);
                  setDeleteExpenseId(null);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default ExpensesModule;

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit, Trash2, Calendar, User, DollarSign, TrendingUp, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AddEmployeeDialog } from '@/components/AddEmployeeDialog';
import { useFactory } from '@/hooks/useFactory';
import { employeeApi } from '@/api';
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

const PaymentsModule = () => {
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<EmployeePayment | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeePayments, setEmployeePayments] = useState<EmployeePayment[]>([]);
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const { toast } = useToast();
  const { factoryId: hookFactoryId } = useFactory();
  const { guardAction, isReadOnly } = useSubscriptionGuard();

  useEffect(() => {
    if (hookFactoryId) {
      setFactoryId(hookFactoryId);
    }
  }, [hookFactoryId]);

  const handleAddClick = () => {
    guardAction(() => {
      // Auto-select first employee when opening dialog if available
      if (employeeOptions.length > 0 && !paymentForm.employee_name) {
        setPaymentForm(prev => ({ ...prev, employee_name: employeeOptions[0].value }));
      }
      setIsDialogOpen(true);
    });
  };

  // Auto-calculated wages
  const [productionWages, setProductionWages] = useState(0);
  const [loadingWages, setLoadingWages] = useState(0);
  const [productionPunches, setProductionPunches] = useState(0);
  const [loadingBricks, setLoadingBricks] = useState(0);
  const [productionRate, setProductionRate] = useState(15);
  const [loadingRate, setLoadingRate] = useState(2);

  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    employee_name: '',
    amount: '',
    payment_type: '',
    notes: ''
  });

  const paymentTypes = ['Salary', 'Advance', 'Bonus', 'Incentive'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const loadFactoryId = async () => {
    // Factory ID is loaded via useFactory hook
  };

  const loadPayments = async () => {
    if (!factoryId) return;
    
    try {
      const data = await employeeApi.getPayments(
        factoryId,
        dateFilter.start || undefined,
        dateFilter.end || undefined
      );
      
      setPayments(data || []);
      calculateEmployeeSummaries(data || []);
    } catch (error: any) {
      toast({ title: 'Error loading payments', description: error.response?.data?.detail || 'Failed to load', variant: 'destructive' });
    }
  };

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

  const loadEmployeePayments = async (employeeName: string) => {
    if (!factoryId) return;
    
    try {
      const data = await employeeApi.getPayments(factoryId);
      const filtered = data
        .filter(p => p.employee_name.toLowerCase() === employeeName.toLowerCase())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setEmployeePayments(filtered || []);
    } catch (error: any) {
      toast({ title: 'Error loading employee payments', description: error.response?.data?.detail || 'Failed to load', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryId) {
      toast({ title: 'Error', description: 'Factory not found', variant: 'destructive' });
      return;
    }
    
    const paymentData = {
      date: paymentForm.date,
      employee_name: paymentForm.employee_name,
      amount: Number(paymentForm.amount),
      payment_type: paymentForm.payment_type,
      notes: paymentForm.notes,
      factory_id: factoryId
    };

    try {
      if (editingPayment) {
        toast({ title: 'Update functionality coming soon' });
        return;
      } else {
        await employeeApi.createPayment(paymentData);
      }

      await loadPayments();
      setIsDialogOpen(false);
      setEditingPayment(null);
      setPaymentForm({
        date: new Date().toISOString().split('T')[0],
        employee_name: '',
        amount: '',
        payment_type: '',
        notes: ''
      });
      
      toast({ title: editingPayment ? 'Payment updated successfully' : 'Payment added successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to save payment', variant: 'destructive' });
    }
  };

  const [deleteDialogState, setDeleteDialogState] = useState<{open: boolean, id: string}>({
    open: false,
    id: ''
  });

  const deletePayment = async (id: string) => {
    try {
      await employeeApi.deletePayment(id);
      await loadPayments();
      toast({ title: 'Payment deleted successfully' });
    } catch (error: any) {
      toast({ title: 'Error deleting payment', description: error.response?.data?.detail || 'Failed to delete', variant: 'destructive' });
    }
    setDeleteDialogState({open: false, id: ''});
  };

  const editPayment = (payment: EmployeePayment) => {
    setEditingPayment(payment);
    setPaymentForm({
      date: payment.date,
      employee_name: payment.employee_name,
      amount: payment.amount.toString(),
      payment_type: payment.payment_type,
      notes: payment.notes || ''
    });
    setIsDialogOpen(true);
  };

  const viewEmployeeDetails = (employeeName: string) => {
    setSelectedEmployee(employeeName);
    loadEmployeePayments(employeeName);
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'Salary': return 'primary';
      case 'Advance': return 'warning';
      case 'Bonus': return 'success';
      case 'Incentive': return 'secondary';
      default: return 'muted';
    }
  };

  const getTodayPayments = () => {
    const today = new Date().toISOString().split('T')[0];
    return payments.filter(payment => payment.date === today);
  };

  const getWeeklyPayments = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];
    return payments.filter(payment => payment.date >= weekAgoStr);
  };

  const clearDateFilter = () => {
    setDateFilter({ start: '', end: '' });
  };

  useEffect(() => {
    loadFactoryId();
  }, []);

  useEffect(() => {
    if (factoryId) {
      loadPayments();
      loadEmployeeNames();
      calculateAutoWages();
    }
  }, [factoryId, dateFilter]);

  const calculateAutoWages = async () => {
    try {
      // Get active rates
      const { data: ratesData } = await supabase
        .from("factory_rates")
        .select("*")
        .eq("is_active", true);

      if (ratesData) {
        const prodRate = ratesData.find((r) => r.rate_type === "production_per_punch");
        const loadRate = ratesData.find((r) => r.rate_type === "loading_per_brick");
        if (prodRate) setProductionRate(prodRate.rate_amount);
        if (loadRate) setLoadingRate(loadRate.rate_amount);
      }

      // Calculate production wages
      const { data: productionData } = await supabase
        .from("bricks_production")
        .select("number_of_punches")
        .gte("date", dateFilter.start)
        .lte("date", dateFilter.end);

      const totalPunches = productionData?.reduce(
        (sum, record) => sum + record.number_of_punches,
        0
      ) || 0;
      setProductionPunches(totalPunches);
      setProductionWages(totalPunches * productionRate);

      // Calculate loading wages
      const { data: salesData } = await supabase
        .from("sales")
        .select("quantity_sold")
        .gte("date", dateFilter.start)
        .lte("date", dateFilter.end);

      const totalBricks = salesData?.reduce(
        (sum, record) => sum + record.quantity_sold,
        0
      ) || 0;
      setLoadingBricks(totalBricks);
      setLoadingWages(totalBricks * loadingRate);
    } catch (error) {
      console.error("Error calculating auto wages:", error);
    }
  };

  if (selectedEmployee) {
    const employee = employees.find(e => e.employee_name === selectedEmployee);
    
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedEmployee(null)}
                className="mb-4"
              >
                ← Back to Payments
              </Button>
              <h1 className="text-3xl font-bold text-foreground">Employee Payment History</h1>
            </div>
          </div>

          {employee && (
            <section className="animate-fade-in">
              <div className="card-metric">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <User className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-secondary">Employee</p>
                    <p className="text-xl font-bold text-foreground">{employee.employee_name}</p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="text-secondary">Total Payments</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(employee.total_amount)}</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-2" />
                    <p className="text-secondary">Payment Count</p>
                    <p className="text-xl font-bold text-foreground">{employee.payment_count}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="animate-slide-up">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Payment History</h2>
            <div className="card-dark">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-secondary">Date</th>
                      <th className="text-left py-3 px-4 text-secondary">Payment Type</th>
                      <th className="text-left py-3 px-4 text-secondary">Amount</th>
                      <th className="text-left py-3 px-4 text-secondary">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeePayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-border hover:bg-accent/5">
                        <td className="py-3 px-4 text-foreground">
                          {new Date(payment.date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-sm px-2 py-1 rounded bg-${getPaymentTypeColor(payment.payment_type)}/20 text-${getPaymentTypeColor(payment.payment_type)}`}>
                            {payment.payment_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-foreground font-semibold">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="py-3 px-4 text-secondary">
                          {payment.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const todayPayments = getTodayPayments();
  const weeklyPayments = getWeeklyPayments();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Employee Payments</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </DialogTrigger>
            <DialogContent className="modal-content">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingPayment ? 'Edit Payment' : 'Add Employee Payment'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select value={paymentForm.payment_type} onValueChange={(value) => setPaymentForm({...paymentForm, payment_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="employeeName">Employee Name</Label>
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
                      onValueChange={(value) => setPaymentForm({ ...paymentForm, employee_name: value })}
                      options={employeeOptions}
                      placeholder="Select employee..."
                      searchPlaceholder="Search employees..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    placeholder="Optional notes about this payment"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary">
                    {editingPayment ? 'Update' : 'Add'} Payment
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <AddEmployeeDialog
            open={isAddEmployeeOpen}
            onOpenChange={setIsAddEmployeeOpen}
            onEmployeeAdded={(name) => {
              setPaymentForm({ ...paymentForm, employee_name: name });
              loadEmployeeNames();
            }}
          />
        </div>

        {/* Date Filter */}
        <section className="animate-fade-in">
          <div className="card-dark p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Filter by Date Range</h3>
            <div className="flex gap-4 items-end">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateFilter.start}
                  onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateFilter.end}
                  onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                />
              </div>
              <Button variant="outline" onClick={clearDateFilter}>
                Clear Filter
              </Button>
            </div>
          </div>
        </section>

        {/* Payment Summary - Consolidated */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Payment Summary</h2>
          <div className="card-metric">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-secondary">Weekly Payments</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(weeklyPayments.reduce((sum, payment) => sum + payment.amount, 0))}
                </p>
                <p className="text-sm text-secondary">{weeklyPayments.length} payments</p>
              </div>
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-secondary">Total Payments</p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))}
                </p>
                <p className="text-sm text-secondary">{payments.length} payments</p>
              </div>
              <div className="text-center">
                <User className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="text-secondary">Employees</p>
                <p className="text-2xl font-bold text-foreground">{employees.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Employees */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Employee Summary</h2>
          <div className="card-dark">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-secondary">Employee Name</th>
                    <th className="text-left py-3 px-4 text-secondary">Total Payments</th>
                    <th className="text-left py-3 px-4 text-secondary">Payment Count</th>
                    <th className="text-left py-3 px-4 text-secondary">Latest Payment</th>
                    <th className="text-left py-3 px-4 text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.employee_name} className="border-b border-border hover:bg-accent/5">
                      <td className="py-3 px-4 text-foreground font-medium">
                        {employee.employee_name}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {formatCurrency(employee.total_amount)}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {employee.payment_count}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {new Date(employee.latest_payment).toLocaleDateString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => viewEmployeeDetails(employee.employee_name)}
                        >
                          View History
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recent Payments */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Recent Payments</h2>
          <div className="card-dark">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-secondary">Date</th>
                    <th className="text-left py-3 px-4 text-secondary">Employee</th>
                    <th className="text-left py-3 px-4 text-secondary">Payment Type</th>
                    <th className="text-left py-3 px-4 text-secondary">Amount</th>
                    <th className="text-left py-3 px-4 text-secondary">Notes</th>
                    <th className="text-left py-3 px-4 text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.slice(0, 15).map((payment) => (
                    <tr key={payment.id} className="border-b border-border hover:bg-accent/5">
                      <td className="py-3 px-4 text-foreground">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-secondary" />
                          {new Date(payment.date).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">
                        {payment.employee_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm px-2 py-1 rounded bg-${getPaymentTypeColor(payment.payment_type)}/20 text-${getPaymentTypeColor(payment.payment_type)}`}>
                          {payment.payment_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-secondary">
                        {payment.notes}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => editPayment(payment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setDeleteDialogState({open: true, id: payment.id})}
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
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogState.open} onOpenChange={(open) => setDeleteDialogState({...deleteDialogState, open})}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this payment record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deletePayment(deleteDialogState.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default PaymentsModule;
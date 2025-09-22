import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Edit, Trash2, Phone, User, IndianRupee, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BrickType {
  id: string;
  type_name: string;
  unit: string;
}

interface Sale {
  id: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  brick_type_id: string;
  quantity_sold: number;
  rate_per_brick: number;
  total_amount: number;
  amount_received: number;
  balance_due: number;
  notes: string;
  brick_types: BrickType;
}

interface CustomerSummary {
  customer_name: string;
  customer_phone: string;
  total_sales: number;
  total_received: number;
  balance_due: number;
  transaction_count: number;
}

const SalesModule = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [brickTypes, setBrickTypes] = useState<BrickType[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const { toast } = useToast();

  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_name: '',
    customer_phone: '',
    brick_type_id: '',
    quantity_sold: '',
    rate_per_brick: '',
    amount_received: '',
    notes: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const loadBrickTypes = async () => {
    const { data, error } = await supabase
      .from('brick_types')
      .select('*')
      .eq('is_active', true)
      .order('type_name');
    
    if (error) {
      toast({ title: 'Error loading brick types', description: error.message, variant: 'destructive' });
    } else {
      setBrickTypes(data || []);
    }
  };

  const loadSales = async () => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        brick_types (
          id,
          type_name,
          unit
        )
      `)
      .order('date', { ascending: false });
    
    if (error) {
      toast({ title: 'Error loading sales', description: error.message, variant: 'destructive' });
    } else {
      setSales(data || []);
      calculateCustomerSummaries(data || []);
    }
  };

  const calculateCustomerSummaries = (salesData: Sale[]) => {
    const customerMap = new Map<string, CustomerSummary>();
    
    salesData.forEach(sale => {
      const key = sale.customer_name.toLowerCase();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customer_name: sale.customer_name,
          customer_phone: sale.customer_phone || '',
          total_sales: 0,
          total_received: 0,
          balance_due: 0,
          transaction_count: 0
        });
      }
      
      const customer = customerMap.get(key)!;
      customer.total_sales += sale.total_amount;
      customer.total_received += sale.amount_received;
      customer.balance_due += sale.balance_due;
      customer.transaction_count += 1;
    });
    
    setCustomers(Array.from(customerMap.values()).sort((a, b) => b.total_sales - a.total_sales));
  };

  const loadCustomerSales = async (customerName: string) => {
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        brick_types (
          id,
          type_name,
          unit
        )
      `)
      .eq('customer_name', customerName)
      .order('date', { ascending: false });
    
    if (error) {
      toast({ title: 'Error loading customer sales', description: error.message, variant: 'destructive' });
    } else {
      setCustomerSales(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = Number(saleForm.quantity_sold) * Number(saleForm.rate_per_brick);
    const amountReceived = Number(saleForm.amount_received);
    const balanceDue = totalAmount - amountReceived;
    
    const saleData = {
      date: saleForm.date,
      customer_name: saleForm.customer_name,
      customer_phone: saleForm.customer_phone,
      brick_type_id: saleForm.brick_type_id,
      quantity_sold: Number(saleForm.quantity_sold),
      rate_per_brick: Number(saleForm.rate_per_brick),
      total_amount: totalAmount,
      amount_received: amountReceived,
      balance_due: balanceDue,
      notes: saleForm.notes
    };

    if (editingSale) {
      const { error } = await supabase
        .from('sales')
        .update(saleData)
        .eq('id', editingSale.id);
      
      if (error) {
        toast({ title: 'Error updating sale', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('sales')
        .insert([saleData]);
      
      if (error) {
        toast({ title: 'Error adding sale', description: error.message, variant: 'destructive' });
        return;
      }
    }

    await loadSales();
    setIsDialogOpen(false);
    setEditingSale(null);
    setSaleForm({
      date: new Date().toISOString().split('T')[0],
      customer_name: '',
      customer_phone: '',
      brick_type_id: '',
      quantity_sold: '',
      rate_per_brick: '',
      amount_received: '',
      notes: ''
    });
    
    toast({ title: editingSale ? 'Sale updated successfully' : 'Sale added successfully' });
  };

  const deleteSale = async (id: string) => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error deleting sale', description: error.message, variant: 'destructive' });
    } else {
      await loadSales();
      toast({ title: 'Sale deleted successfully' });
    }
  };

  const editSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleForm({
      date: sale.date,
      customer_name: sale.customer_name,
      customer_phone: sale.customer_phone || '',
      brick_type_id: sale.brick_type_id,
      quantity_sold: sale.quantity_sold.toString(),
      rate_per_brick: sale.rate_per_brick.toString(),
      amount_received: sale.amount_received.toString(),
      notes: sale.notes || ''
    });
    setIsDialogOpen(true);
  };

  const viewCustomerDetails = (customerName: string) => {
    setSelectedCustomer(customerName);
    loadCustomerSales(customerName);
  };

  const getPaymentStatus = (sale: Sale) => {
    if (sale.balance_due === 0) return { status: 'Paid', color: 'success' };
    if (sale.amount_received === 0) return { status: 'Unpaid', color: 'destructive' };
    return { status: 'Partial', color: 'warning' };
  };

  useEffect(() => {
    loadBrickTypes();
    loadSales();
  }, []);

  if (selectedCustomer) {
    const customer = customers.find(c => c.customer_name === selectedCustomer);
    
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedCustomer(null)}
                className="mb-4"
              >
                ← Back to Sales
              </Button>
              <h1 className="text-3xl font-bold text-foreground">Customer Details</h1>
            </div>
          </div>

          {customer && (
            <section className="animate-fade-in">
              <div className="card-metric">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <User className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-secondary">Customer</p>
                    <p className="text-xl font-bold text-foreground">{customer.customer_name}</p>
                    {customer.customer_phone && (
                      <p className="text-secondary text-sm">{customer.customer_phone}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <IndianRupee className="h-8 w-8 text-success mx-auto mb-2" />
                    <p className="text-secondary">Total Sales</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(customer.total_sales)}</p>
                  </div>
                  <div className="text-center">
                    <IndianRupee className="h-8 w-8 text-warning mx-auto mb-2" />
                    <p className="text-secondary">Balance Due</p>
                    <p className="text-xl font-bold text-warning">{formatCurrency(customer.balance_due)}</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-2" />
                    <p className="text-secondary">Transactions</p>
                    <p className="text-xl font-bold text-foreground">{customer.transaction_count}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="animate-slide-up">
            <h2 className="text-2xl font-semibold text-foreground mb-4">Transaction History</h2>
            <div className="card-dark">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-secondary">Date</th>
                      <th className="text-left py-3 px-4 text-secondary">Brick Type</th>
                      <th className="text-left py-3 px-4 text-secondary">Quantity</th>
                      <th className="text-left py-3 px-4 text-secondary">Rate</th>
                      <th className="text-left py-3 px-4 text-secondary">Total</th>
                      <th className="text-left py-3 px-4 text-secondary">Received</th>
                      <th className="text-left py-3 px-4 text-secondary">Balance</th>
                      <th className="text-left py-3 px-4 text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerSales.map((sale) => {
                      const paymentStatus = getPaymentStatus(sale);
                      return (
                        <tr key={sale.id} className="border-b border-border hover:bg-accent/5">
                          <td className="py-3 px-4 text-foreground">
                            {new Date(sale.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {sale.brick_types.type_name}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {sale.quantity_sold.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {formatCurrency(sale.rate_per_brick)}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {formatCurrency(sale.total_amount)}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {formatCurrency(sale.amount_received)}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {formatCurrency(sale.balance_due)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-sm px-2 py-1 rounded bg-${paymentStatus.color}/20 text-${paymentStatus.color}`}>
                              {paymentStatus.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Sales Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="modal-content max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  {editingSale ? 'Edit Sale' : 'Add New Sale'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={saleForm.date}
                      onChange={(e) => setSaleForm({...saleForm, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="brickType">Brick Type</Label>
                    <Select value={saleForm.brick_type_id} onValueChange={(value) => setSaleForm({...saleForm, brick_type_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brick type" />
                      </SelectTrigger>
                      <SelectContent>
                        {brickTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.type_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={saleForm.customer_name}
                      onChange={(e) => setSaleForm({...saleForm, customer_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Customer Phone</Label>
                    <Input
                      id="customerPhone"
                      value={saleForm.customer_phone}
                      onChange={(e) => setSaleForm({...saleForm, customer_phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={saleForm.quantity_sold}
                      onChange={(e) => setSaleForm({...saleForm, quantity_sold: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="rate">Rate per Brick (₹)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={saleForm.rate_per_brick}
                      onChange={(e) => setSaleForm({...saleForm, rate_per_brick: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="amountReceived">Amount Received (₹)</Label>
                  <Input
                    id="amountReceived"
                    type="number"
                    step="0.01"
                    value={saleForm.amount_received}
                    onChange={(e) => setSaleForm({...saleForm, amount_received: e.target.value})}
                    required
                  />
                </div>
                {saleForm.quantity_sold && saleForm.rate_per_brick && (
                  <div className="p-3 bg-accent/10 rounded">
                    <p className="text-sm text-secondary">
                      Total Amount: {formatCurrency(Number(saleForm.quantity_sold) * Number(saleForm.rate_per_brick))}
                    </p>
                    {saleForm.amount_received && (
                      <p className="text-sm text-secondary">
                        Balance Due: {formatCurrency((Number(saleForm.quantity_sold) * Number(saleForm.rate_per_brick)) - Number(saleForm.amount_received))}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={saleForm.notes}
                    onChange={(e) => setSaleForm({...saleForm, notes: e.target.value})}
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary">
                    {editingSale ? 'Update' : 'Add'} Sale
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sales Summary */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sales Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card-metric">
              <div className="text-center">
                <ShoppingCart className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-secondary">Total Sales</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(sales.reduce((sum, sale) => sum + sale.total_amount, 0))}
                </p>
              </div>
            </div>
            <div className="card-metric">
              <div className="text-center">
                <IndianRupee className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-secondary">Amount Received</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(sales.reduce((sum, sale) => sum + sale.amount_received, 0))}
                </p>
              </div>
            </div>
            <div className="card-metric">
              <div className="text-center">
                <IndianRupee className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-secondary">Outstanding</p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(sales.reduce((sum, sale) => sum + sale.balance_due, 0))}
                </p>
              </div>
            </div>
            <div className="card-metric">
              <div className="text-center">
                <User className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="text-secondary">Customers</p>
                <p className="text-2xl font-bold text-foreground">{customers.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Top Customers */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Top Customers</h2>
          <div className="card-dark">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-secondary">Customer</th>
                    <th className="text-left py-3 px-4 text-secondary">Contact</th>
                    <th className="text-left py-3 px-4 text-secondary">Total Sales</th>
                    <th className="text-left py-3 px-4 text-secondary">Amount Received</th>
                    <th className="text-left py-3 px-4 text-secondary">Balance Due</th>
                    <th className="text-left py-3 px-4 text-secondary">Transactions</th>
                    <th className="text-left py-3 px-4 text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 10).map((customer) => (
                    <tr key={customer.customer_name} className="border-b border-border hover:bg-accent/5">
                      <td className="py-3 px-4 text-foreground font-medium">
                        {customer.customer_name}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {customer.customer_phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-secondary" />
                            {customer.customer_phone}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {formatCurrency(customer.total_sales)}
                      </td>
                      <td className="py-3 px-4 text-success">
                        {formatCurrency(customer.total_received)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`${customer.balance_due > 0 ? 'text-warning' : 'text-success'}`}>
                          {formatCurrency(customer.balance_due)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {customer.transaction_count}
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => viewCustomerDetails(customer.customer_name)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Recent Sales */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Recent Sales</h2>
          <div className="card-dark">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-secondary">Date</th>
                    <th className="text-left py-3 px-4 text-secondary">Customer</th>
                    <th className="text-left py-3 px-4 text-secondary">Brick Type</th>
                    <th className="text-left py-3 px-4 text-secondary">Quantity</th>
                    <th className="text-left py-3 px-4 text-secondary">Total Amount</th>
                    <th className="text-left py-3 px-4 text-secondary">Balance Due</th>
                    <th className="text-left py-3 px-4 text-secondary">Status</th>
                    <th className="text-left py-3 px-4 text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 10).map((sale) => {
                    const paymentStatus = getPaymentStatus(sale);
                    return (
                      <tr key={sale.id} className="border-b border-border hover:bg-accent/5">
                        <td className="py-3 px-4 text-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-secondary" />
                            {new Date(sale.date).toLocaleDateString('en-IN')}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          <div>
                            <p className="font-medium">{sale.customer_name}</p>
                            {sale.customer_phone && (
                              <p className="text-sm text-secondary">{sale.customer_phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {sale.brick_types.type_name}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {sale.quantity_sold.toLocaleString()} {sale.brick_types.unit}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {formatCurrency(sale.total_amount)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`${sale.balance_due > 0 ? 'text-warning' : 'text-success'}`}>
                            {formatCurrency(sale.balance_due)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-sm px-2 py-1 rounded bg-${paymentStatus.color}/20 text-${paymentStatus.color}`}>
                            {paymentStatus.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => editSale(sale)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => deleteSale(sale.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </section>
      </div>
    </div>
  );
};

export default SalesModule;
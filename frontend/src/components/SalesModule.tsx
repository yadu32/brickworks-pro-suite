import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Plus, Edit, Trash2, Phone, User, IndianRupee, Calendar, TrendingUp, Download, Mail, Search, X, DollarSign, Lock, UserPlus } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateInvoicePDF, shareViaWhatsApp, shareViaEmail, downloadPDF } from '@/utils/invoiceGenerator';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { AddCustomerDialog } from '@/components/AddCustomerDialog';
import { useFactory } from '@/hooks/useFactory';
import { saleApi, customerApi, productApi } from '@/api';

interface ProductType {
  id: string;
  name: string;
  unit: string;
}

interface Sale {
  id: string;
  date: string;
  customer_name: string;
  customer_phone: string;
  product_id: string;
  quantity_sold: number;
  rate_per_brick: number;
  total_amount: number;
  amount_received: number;
  balance_due: number;
  notes: string;
  product_definitions: ProductType;
}

interface CustomerSummary {
  customer_name: string;
  customer_phone: string;
  total_sales: number;
  total_received: number;
  balance_due: number;
  transaction_count: number;
  last_transaction_date: string;
}

interface SalesModuleProps {
  initialShowDuesOnly?: boolean;
}

const SalesModule = ({ initialShowDuesOnly = false }: SalesModuleProps) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDuesOnly, setShowDuesOnly] = useState(initialShowDuesOnly);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentCustomer, setPaymentCustomer] = useState<CustomerSummary | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Array<{ value: string; label: string; phone: string }>>([]);
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const { toast } = useToast();
  const { factoryId: hookFactoryId } = useFactory();
  const isReadOnly = false;

  useEffect(() => {
    if (hookFactoryId) {
      setFactoryId(hookFactoryId);
    }
  }, [hookFactoryId]);

  const handleAddClick = () => {
    // Auto-select first product when opening dialog
    if (productTypes.length > 0 && !saleForm.product_id) {
      setSaleForm(prev => ({ ...prev, product_id: productTypes[0].id }));
    }
    setIsDialogOpen(true);
  };

  // Update showDuesOnly when initialShowDuesOnly prop changes
  useEffect(() => {
    setShowDuesOnly(initialShowDuesOnly);
  }, [initialShowDuesOnly]);

  const loadFactoryId = async () => {
    // Factory ID is loaded via useFactory hook
  };

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const loadProductTypes = async () => {
    if (!factoryId) return;
    
    try {
      const data = await productApi.getByFactory(factoryId);
      setProductTypes(data || []);
      // Auto-select first product if none selected
      if (data && data.length > 0 && !saleForm.product_id) {
        setSaleForm(prev => ({ ...prev, product_id: data[0].id }));
      }
    } catch (error: any) {
      toast({ title: 'Error loading product types', description: error.response?.data?.detail || 'Failed to load', variant: 'destructive' });
    }
  };

  const loadSales = async () => {
    if (!factoryId) return;
    
    try {
      const salesData = await saleApi.getByFactory(factoryId);
      const products = await productApi.getByFactory(factoryId);
      
      // Enrich sales with product details
      const enrichedSales = salesData.map(sale => ({
        ...sale,
        product_definitions: products.find(p => p.id === sale.product_id) || {
          id: sale.product_id,
          name: 'Unknown',
          unit: 'pieces'
        }
      }));
      
      setSales(enrichedSales as unknown as Sale[]);
      calculateCustomerSummaries(enrichedSales as unknown as Sale[]);
    } catch (error: any) {
      toast({ title: 'Error loading sales', description: error.response?.data?.detail || 'Failed to load', variant: 'destructive' });
    }
  };

  const calculateCustomerSummaries = (salesData: Sale[]) => {
    const customerMap = new Map<string, CustomerSummary>();
    
    salesData.forEach(sale => {
      const key = sale.customer_name;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customer_name: sale.customer_name,
          customer_phone: sale.customer_phone || '',
          total_sales: 0,
          total_received: 0,
          balance_due: 0,
          transaction_count: 0,
          last_transaction_date: sale.date
        });
      }
      
      const customer = customerMap.get(key)!;
      customer.total_sales += sale.total_amount;
      customer.total_received += sale.amount_received;
      customer.balance_due += sale.balance_due;
      customer.transaction_count += 1;
      
      // Update to most recent transaction date
      if (new Date(sale.date) > new Date(customer.last_transaction_date)) {
        customer.last_transaction_date = sale.date;
      }
    });
    
    setCustomers(Array.from(customerMap.values()).sort((a, b) => b.total_sales - a.total_sales));
  };

  const loadCustomers = async () => {
    if (!factoryId) return;
    
    try {
      // Fetch customers from the customers table
      const customersData = await customerApi.getByFactory(factoryId);
      
      const options = customersData.map(c => ({
        value: c.name,
        label: c.name,
        phone: c.phone || ''
      }));
      
      setCustomerOptions(options);
    } catch (error: any) {
      console.error('Error loading customers:', error);
      // Fallback to building from sales if customers API fails
      const uniqueCustomers = new Map<string, { name: string; phone: string }>();
      sales.forEach(sale => {
        if (!uniqueCustomers.has(sale.customer_name)) {
          uniqueCustomers.set(sale.customer_name, {
            name: sale.customer_name,
            phone: sale.customer_phone || ''
          });
        }
      });
      
      const options = Array.from(uniqueCustomers.values()).map(c => ({
        value: c.name,
        label: c.name,
        phone: c.phone
      }));
      
      setCustomerOptions(options);
    }
  };

  const loadCustomerSales = async (customerName: string) => {
    if (!factoryId) return;
    
    try {
      const salesData = await saleApi.getByFactory(factoryId);
      const products = await productApi.getByFactory(factoryId);
      
      const filtered = salesData
        .filter(s => s.customer_name === customerName)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const enriched = filtered.map(sale => ({
        ...sale,
        product_definitions: products.find(p => p.id === sale.product_id) || {
          id: sale.product_id,
          name: 'Unknown',
          unit: 'pieces'
        }
      }));
      
      setCustomerSales(enriched as unknown as Sale[]);
    } catch (error: any) {
      toast({ title: 'Error loading customer sales', description: error.response?.data?.detail || 'Failed to load', variant: 'destructive' });
    }
  };

  const applyFIFOPayments = async (customerName: string, paymentAmount: number, newSaleId?: string) => {
    if (!factoryId) return paymentAmount;
    
    // Get all unpaid sales for this customer, ordered by date (oldest first)
    const { data: unpaidSales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('factory_id', factoryId)
      .eq('customer_name', customerName)
      .gt('balance_due', 0)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching unpaid sales:', error);
      return paymentAmount;
    }

    let remainingPayment = paymentAmount;
    const updatedSales: any[] = [];

    // Apply payment to oldest unpaid sales first
    for (const sale of unpaidSales || []) {
      if (remainingPayment <= 0) break;
      
      // Skip the new sale we just created to avoid double-applying payment
      if (sale.id === newSaleId) continue;

      const amountToApply = Math.min(remainingPayment, sale.balance_due);
      const newAmountReceived = sale.amount_received + amountToApply;
      const newBalanceDue = sale.balance_due - amountToApply;

      updatedSales.push({
        id: sale.id,
        amount_received: newAmountReceived,
        balance_due: newBalanceDue
      });

      remainingPayment -= amountToApply;
    }

    // Update all affected sales
    for (const updatedSale of updatedSales) {
      await supabase
        .from('sales')
        .update({
          amount_received: updatedSale.amount_received,
          balance_due: updatedSale.balance_due
        })
        .eq('id', updatedSale.id);
    }

    return remainingPayment;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== SALE FORM SUBMIT ===');
    console.log('saleForm:', saleForm);
    console.log('product_id:', saleForm.product_id);
    console.log('productTypes list:', productTypes);
    
    if (!factoryId) {
      toast({ title: 'Error', description: 'Factory not found', variant: 'destructive' });
      return;
    }
    
    // CRITICAL VALIDATION: Ensure product_id is not empty
    if (!saleForm.product_id || saleForm.product_id.trim() === '') {
      console.error('VALIDATION FAILED: No product selected');
      toast({ title: 'Error', description: 'Please select a product type from the dropdown', variant: 'destructive' });
      return;
    }
    
    if (!saleForm.customer_name || saleForm.customer_name.trim() === '') {
      console.error('VALIDATION FAILED: No customer name');
      toast({ title: 'Error', description: 'Please enter customer name', variant: 'destructive' });
      return;
    }
    
    const totalAmount = Number(saleForm.quantity_sold) * Number(saleForm.rate_per_brick);
    const amountReceived = Number(saleForm.amount_received) || 0;
    const balanceDue = totalAmount - amountReceived;
    
    const saleData = {
      date: saleForm.date,
      customer_name: saleForm.customer_name,
      customer_phone: saleForm.customer_phone || undefined,
      product_id: saleForm.product_id,
      quantity_sold: Number(saleForm.quantity_sold),
      rate_per_brick: Number(saleForm.rate_per_brick),
      total_amount: totalAmount,
      amount_received: amountReceived,
      balance_due: balanceDue,
      notes: saleForm.notes,
      factory_id: factoryId
    };

    try {
      if (editingSale) {
        await saleApi.update(editingSale.id, saleData);
        toast({ title: 'Sale updated successfully' });
      } else {
        await saleApi.create(saleData);
        toast({ title: 'Sale added successfully' });
      }

      await loadSales();
      setIsDialogOpen(false);
      setEditingSale(null);
      setSaleForm({
        date: new Date().toISOString().split('T')[0],
        customer_name: '',
        customer_phone: '',
        product_id: '',
        quantity_sold: '',
        rate_per_brick: '',
        amount_received: '',
        notes: ''
      });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to save sale', 
        variant: 'destructive' 
      });
    }
  };

  const [deleteDialogState, setDeleteDialogState] = useState<{open: boolean, id: string}>({
    open: false,
    id: ''
  });

  const deleteSale = async (id: string) => {
    try {
      await saleApi.delete(id);
      await loadSales();
      toast({ title: 'Sale deleted successfully' });
    } catch (error: any) {
      toast({ 
        title: 'Error deleting sale', 
        description: error.response?.data?.detail || 'Failed to delete', 
        variant: 'destructive' 
      });
    }
    setDeleteDialogState({open: false, id: ''});
  };

  const editSale = (sale: Sale) => {
    setEditingSale(sale);
    setSaleForm({
      date: sale.date,
      customer_name: sale.customer_name,
      customer_phone: sale.customer_phone || '',
      product_id: sale.product_id,
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

  const handleShareInvoice = async (sale: Sale, method: 'whatsapp' | 'email' | 'download') => {
    try {
      const invoiceData = {
        invoiceNumber: `SALE-${sale.id.slice(0, 8).toUpperCase()}`,
        date: sale.date,
        customerName: sale.customer_name,
        customerPhone: sale.customer_phone,
        brickTypeName: sale.product_definitions?.name || 'Product',
        quantity: sale.quantity_sold,
        ratePerBrick: sale.rate_per_brick,
        totalAmount: sale.total_amount,
        amountReceived: sale.amount_received,
        balanceDue: sale.balance_due,
        paymentStatus: getPaymentStatus(sale).status
      };

      const pdfBlob = await generateInvoicePDF(invoiceData);

      if (method === 'whatsapp') {
        shareViaWhatsApp(invoiceData, pdfBlob);
      } else if (method === 'email') {
        shareViaEmail(invoiceData);
      } else {
        downloadPDF(pdfBlob, `invoice-${invoiceData.invoiceNumber}.pdf`);
      }

      toast({ title: 'Invoice generated successfully' });
    } catch (error) {
      toast({ title: 'Error generating invoice', variant: 'destructive' });
      console.error(error);
    }
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.customer_name.toLowerCase().includes(query) ||
        (c.customer_phone && c.customer_phone.toLowerCase().includes(query))
      );
    }
    
    // Apply dues filter
    if (showDuesOnly) {
      filtered = filtered.filter(c => c.balance_due > 0);
    }
    
    return filtered;
  }, [customers, searchQuery, showDuesOnly]);

  const handlePayDue = (customer: CustomerSummary) => {
    setPaymentCustomer(customer);
    setPaymentForm({
      amount: customer.balance_due.toString(),
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentCustomer) return;

    const paymentAmount = Number(paymentForm.amount);
    if (paymentAmount <= 0) {
      toast({ title: 'Invalid amount', variant: 'destructive' });
      return;
    }

    // Apply FIFO payment logic
    await applyFIFOPayments(paymentCustomer.customer_name, paymentAmount);
    
    await loadSales();
    setIsPaymentDialogOpen(false);
    setPaymentCustomer(null);
    setPaymentForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    
    toast({ title: 'Payment recorded successfully' });
  };

  useEffect(() => {
    loadFactoryId();
  }, []);

  useEffect(() => {
    if (factoryId) {
      loadProductTypes();
      loadSales();
    }
  }, [factoryId]);

  useEffect(() => {
    loadCustomers();
  }, [sales]);

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
            <h2 className="text-2xl font-semibold text-foreground mb-4">Customer Ledger</h2>
            <div className="card-dark">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-secondary">Date</th>
                      <th className="text-left py-3 px-4 text-secondary">Transaction</th>
                      <th className="text-left py-3 px-4 text-secondary">Sale Amount</th>
                      <th className="text-left py-3 px-4 text-secondary">Payment</th>
                      <th className="text-left py-3 px-4 text-secondary">Running Balance</th>
                      <th className="text-left py-3 px-4 text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let runningBalance = 0;
                      return customerSales.map((sale, index) => {
                        // Add sale amount to running balance
                        runningBalance += sale.total_amount;
                        const saleBalance = runningBalance;
                        
                        // Subtract payment from running balance
                        runningBalance -= sale.amount_received;
                        
                        const paymentStatus = getPaymentStatus(sale);
                        
                        return (
                          <React.Fragment key={sale.id}>
                            {/* Sale Transaction Row */}
                            <tr className="border-b border-border hover:bg-accent/5">
                              <td className="py-3 px-4 text-foreground">
                                {new Date(sale.date).toLocaleDateString('en-IN')}
                              </td>
                              <td className="py-3 px-4 text-foreground">
                                <div>
                                  <p className="font-medium">Sale: {sale.product_definitions?.name || 'Product'}</p>
                                  <p className="text-sm text-secondary">
                                    {sale.quantity_sold.toLocaleString()} @ {formatCurrency(sale.rate_per_brick)}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-destructive font-medium">
                                +{formatCurrency(sale.total_amount)}
                              </td>
                              <td className="py-3 px-4 text-secondary">
                                -
                              </td>
                              <td className="py-3 px-4 text-foreground font-medium">
                                {formatCurrency(saleBalance)}
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm px-2 py-1 rounded bg-destructive/20 text-destructive">
                                  Due
                                </span>
                              </td>
                            </tr>
                            
                            {/* Payment Transaction Row (if payment was made) */}
                            {sale.amount_received > 0 && (
                              <tr className="border-b border-border hover:bg-accent/5">
                                <td className="py-3 px-4 text-foreground">
                                  {new Date(sale.date).toLocaleDateString('en-IN')}
                                </td>
                                <td className="py-3 px-4 text-foreground">
                                  <p className="font-medium">Payment Received</p>
                                  {sale.notes && (
                                    <p className="text-sm text-secondary">{sale.notes}</p>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-secondary">
                                  -
                                </td>
                                <td className="py-3 px-4 text-success font-medium">
                                  -{formatCurrency(sale.amount_received)}
                                </td>
                                <td className="py-3 px-4 text-foreground font-medium">
                                  {formatCurrency(runningBalance)}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-sm px-2 py-1 rounded bg-${paymentStatus.color}/20 text-${paymentStatus.color}`}>
                                    {paymentStatus.status}
                                  </span>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
              
              {/* Summary Footer */}
              <div className="mt-6 p-4 bg-accent/10 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-secondary text-sm">Total Sales</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(customerSales.reduce((sum, sale) => sum + sale.total_amount, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-secondary text-sm">Total Payments</p>
                    <p className="text-xl font-bold text-success">
                      {formatCurrency(customerSales.reduce((sum, sale) => sum + sale.amount_received, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-secondary text-sm">Outstanding Balance</p>
                    <p className="text-xl font-bold text-warning">
                      {formatCurrency(customerSales.reduce((sum, sale) => sum + sale.balance_due, 0))}
                    </p>
                  </div>
                </div>
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
          {/* Header */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h1 className="text-3xl font-bold text-foreground">Sales Management</h1>
            <div className="flex gap-2">
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
                    <Label htmlFor="productType">Product Type</Label>
                    <Select value={saleForm.product_id} onValueChange={(value) => setSaleForm({...saleForm, product_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product type" />
                      </SelectTrigger>
                      <SelectContent>
                        {productTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="customerName">Customer Name</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddCustomerOpen(true)}
                        className="h-7 text-xs"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Add New
                      </Button>
                    </div>
                    <SearchableSelect
                      options={customerOptions}
                      value={saleForm.customer_name}
                      onChange={(value) => {
                        const selectedCustomer = customerOptions.find(c => c.value === value);
                        setSaleForm({
                          ...saleForm, 
                          customer_name: value,
                          customer_phone: selectedCustomer?.phone || ''
                        });
                      }}
                      placeholder="Select or type customer name..."
                      searchPlaceholder="Search customers..."
                    />
                  </div>
                  <div>
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    value={saleForm.customer_phone}
                    onChange={(e) => setSaleForm({...saleForm, customer_phone: e.target.value})}
                    readOnly={!!saleForm.customer_name}
                    className={saleForm.customer_name ? "bg-muted" : ""}
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

        <AddCustomerDialog
          open={isAddCustomerOpen}
          onOpenChange={setIsAddCustomerOpen}
          onCustomerAdded={(name, phone) => {
            setSaleForm({ ...saleForm, customer_name: name, customer_phone: phone });
            loadCustomers(); // Reload customer list
          }}
        />
      </div>

        {/* Overall Summary - Consolidated */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sales Summary</h2>
          <div className="card-metric">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <ShoppingCart className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-secondary">Total Sales</p>
                <p className="text-2xl font-bold text-foreground">{sales.length}</p>
              </div>
              <div className="text-center">
                <IndianRupee className="h-8 w-8 text-success mx-auto mb-2" />
                <p className="text-secondary">Revenue</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(sales.reduce((sum, s) => sum + s.total_amount, 0))}
                </p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-warning mx-auto mb-2" />
                <p className="text-secondary">Balance Due</p>
                <p className="text-2xl font-bold text-warning">
                  {formatCurrency(sales.reduce((sum, s) => sum + s.balance_due, 0))}
                </p>
              </div>
              <div className="text-center">
                <User className="h-8 w-8 text-secondary mx-auto mb-2" />
                <p className="text-secondary">Customers</p>
                <p className="text-2xl font-bold text-foreground">{customers.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Customers Table with Search and Filter */}
        <section className="animate-slide-up">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Customers</h2>
          <div className="flex gap-3 items-center mb-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary" />
              <Input
                type="text"
                placeholder="Search customers by name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* Due Filter Toggle */}
            <Button
              variant={showDuesOnly ? "default" : "outline"}
              onClick={() => setShowDuesOnly(!showDuesOnly)}
              className={showDuesOnly ? "btn-primary" : ""}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {showDuesOnly ? 'Show All' : 'Due Only'}
            </Button>
          </div>
          
          {/* Filter Results Info */}
          {(searchQuery || showDuesOnly) && (
            <p className="text-sm text-secondary mb-3">
              Showing {filteredCustomers.length} of {customers.length} customers
              {showDuesOnly && ' with dues'}
            </p>
          )}

          <div className="card-dark">
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-secondary bg-card">Customer</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Contact</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Total Sales</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Amount Received</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Balance Due</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Last Transaction</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-secondary">
                        {searchQuery || showDuesOnly 
                          ? 'No customers found matching your filters' 
                          : 'No customers yet'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr key={customer.customer_name} className="border-b border-border hover:bg-accent/5">
                        <td className="py-3 px-4 text-foreground font-medium">
                          {customer.customer_name}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {customer.customer_phone && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Call ${customer.customer_phone}?`)) {
                                  window.location.href = `tel:${customer.customer_phone}`;
                                }
                              }}
                              className="flex items-center hover:text-primary cursor-pointer"
                            >
                              <Phone className="h-4 w-4 mr-2 text-secondary" />
                              {customer.customer_phone}
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {formatCurrency(customer.total_sales)}
                        </td>
                        <td className="py-3 px-4 text-success">
                          {formatCurrency(customer.total_received)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${customer.balance_due > 0 ? 'text-warning' : 'text-success'}`}>
                            {formatCurrency(customer.balance_due)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-foreground text-sm">
                          {new Date(customer.last_transaction_date).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => viewCustomerDetails(customer.customer_name)}
                            >
                              View Details
                            </Button>
                            {customer.balance_due > 0 && (
                              <Button 
                                size="sm" 
                                className="btn-primary"
                                onClick={() => handlePayDue(customer)}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Pay Due
                              </Button>
                            )}
                            {customer.customer_phone && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const message = `Hi ${customer.customer_name}, your current balance is ${formatCurrency(customer.balance_due)}. Total sales: ${formatCurrency(customer.total_sales)}`;
                                  window.open(`https://wa.me/${customer.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="modal-content max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Record Payment</DialogTitle>
            </DialogHeader>
            {paymentCustomer && (
              <div className="mb-4 p-3 bg-accent/10 rounded">
                <p className="text-sm text-secondary">Customer</p>
                <p className="font-medium text-foreground">{paymentCustomer.customer_name}</p>
                <p className="text-sm text-warning mt-2">Outstanding Balance: {formatCurrency(paymentCustomer.balance_due)}</p>
              </div>
            )}
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <Label htmlFor="payment-amount">Payment Amount (₹)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment-date">Payment Date</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment-notes">Notes (optional)</Label>
                <Textarea
                  id="payment-notes"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  placeholder="Payment method, reference number, etc."
                />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="btn-primary">
                  Record Payment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sales */}
        <section className="animate-fade-in">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Sales</h2>
          <div className="card-dark">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-card z-10 border-b-2 border-border">
                  <tr>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Date</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Customer</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Brick & Qty</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Total Amount</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Balance Due</th>
                    <th className="text-left py-3 px-4 text-secondary bg-card">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
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
                        <div>
                          <p className="font-medium">{sale.product_definitions?.name || 'Product'}</p>
                          <p className="text-sm text-secondary">{sale.quantity_sold.toLocaleString()} {sale.product_definitions?.unit || 'units'}</p>
                        </div>
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
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleShareInvoice(sale, 'download')}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleShareInvoice(sale, 'whatsapp')}
                            title="Share via WhatsApp"
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageCircle className="h-4 w-4 fill-current" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleShareInvoice(sale, 'email')}
                            title="Share via Email"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
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
                            onClick={() => setDeleteDialogState({open: true, id: sale.id})}
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
                This action cannot be undone. This will permanently delete this sale record.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteSale(deleteDialogState.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SalesModule;
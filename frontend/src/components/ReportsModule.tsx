import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Package, Users, DollarSign, Factory, Truck, Wrench, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReportData {
  startDate: string;
  endDate: string;
  production: {
    totalPunches: number;
    byType: { name: string; quantity: number; punches: number }[];
  };
  sales: {
    totalRevenue: number;
    totalQtySold: number;
    outstandingBalance: number;
    records: any[];
  };
  materials: {
    purchased: { name: string; quantity: number; cost: number }[];
    used: { name: string; quantity: number }[];
    totalPurchaseCost: number;
  };
  payments: {
    salary: number;
    advance: number;
    bonus: number;
    incentive: number;
    total: number;
    records: any[];
  };
  cogs: {
    materialCost: number;
    productionWages: number;
    loadingWages: number;
    totalCOGS: number;
  };
  expenses: {
    transport: number;
    utilities: number;
    salaries: number;
    repairs: number;
    miscellaneous: number;
    total: number;
    records: any[];
  };
  netProfit: number;
  productionRecords: any[];
  purchaseRecords: any[];
  usageRecords: any[];
}

const ReportsModule = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: (() => {
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      return monday.toISOString().split('T')[0];
    })(),
    endDate: (() => {
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? 0 : 7);
      const sunday = new Date(date.setDate(diff));
      return sunday.toISOString().split('T')[0];
    })()
  });
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

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

  useEffect(() => {
    loadFactoryId();
  }, []);

  useEffect(() => {
    if (factoryId) {
      generateReport();
    }
  }, [factoryId]);

  const generateReport = async () => {
    if (!factoryId) return;
    
    setLoading(true);
    try {
      // Fetch factory rates for wage calculations
      const { data: rates } = await supabase
        .from('factory_rates')
        .select('*')
        .eq('factory_id', factoryId)
        .eq('is_active', true);

      const productionRate = rates?.find(r => r.rate_type === 'production_per_punch')?.rate_amount || 15;
      const loadingRate = rates?.find(r => r.rate_type === 'loading_per_brick')?.rate_amount || 2;

      // Fetch production data
      const { data: productionData } = await supabase
        .from('production_logs')
        .select('*, product_definitions(*)')
        .eq('factory_id', factoryId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      // Fetch sales data
      const { data: salesData } = await supabase
        .from('sales')
        .select('*, product_definitions(*)')
        .eq('factory_id', factoryId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      // Fetch material purchases
      const { data: purchasesData } = await supabase
        .from('material_purchases')
        .select('*, materials(*)')
        .eq('factory_id', factoryId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      // Fetch material usage
      const { data: usageData } = await supabase
        .from('material_usage')
        .select('*, materials(*)')
        .eq('factory_id', factoryId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      // Fetch employee payments
      const { data: paymentsData } = await supabase
        .from('employee_payments')
        .select('*')
        .eq('factory_id', factoryId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      // Fetch other expenses
      const { data: expensesData } = await supabase
        .from('other_expenses')
        .select('*')
        .eq('factory_id', factoryId)
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      // Calculate Production Summary
      const productionByType = new Map<string, { name: string; quantity: number; punches: number }>();
      let totalPunches = 0;
      productionData?.forEach(p => {
        const typeName = p.product_definitions?.name || 'Unknown';
        const existing = productionByType.get(typeName) || { name: typeName, quantity: 0, punches: 0 };
        existing.quantity += p.quantity;
        existing.punches += p.punches || 0;
        totalPunches += p.punches || 0;
        productionByType.set(typeName, existing);
      });

      // Calculate Sales Performance
      const totalRevenue = salesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalQtySold = salesData?.reduce((sum, s) => sum + s.quantity_sold, 0) || 0;
      const outstandingBalance = salesData?.reduce((sum, s) => sum + Number(s.balance_due), 0) || 0;

      // Calculate Materials Consumption
      const purchasesByMaterial = new Map<string, { name: string; quantity: number; cost: number }>();
      const usageByMaterial = new Map<string, { name: string; quantity: number }>();
      let totalPurchaseCost = 0;

      purchasesData?.forEach(p => {
        const materialName = p.materials?.material_name || 'Unknown';
        const cost = Number(p.quantity_purchased) * Number(p.unit_cost);
        const existing = purchasesByMaterial.get(materialName) || { name: materialName, quantity: 0, cost: 0 };
        existing.quantity += Number(p.quantity_purchased);
        existing.cost += cost;
        totalPurchaseCost += cost;
        purchasesByMaterial.set(materialName, existing);
      });

      usageData?.forEach(u => {
        const materialName = u.materials?.material_name || 'Unknown';
        const existing = usageByMaterial.get(materialName) || { name: materialName, quantity: 0 };
        existing.quantity += Number(u.quantity_used);
        usageByMaterial.set(materialName, existing);
      });

      // Calculate Employee Payments
      let salary = 0, advance = 0, bonus = 0, incentive = 0;
      paymentsData?.forEach(p => {
        const amount = Number(p.amount);
        switch (p.payment_type.toLowerCase()) {
          case 'salary': salary += amount; break;
          case 'advance': advance += amount; break;
          case 'bonus': bonus += amount; break;
          case 'incentive': incentive += amount; break;
          default: salary += amount;
        }
      });
      const totalPayments = salary + advance + bonus + incentive;

      // Calculate COGS
      const productionWages = totalPunches * productionRate;
      const loadingWages = totalQtySold * loadingRate;
      const totalCOGS = totalPurchaseCost + productionWages + loadingWages;

      // Calculate Operating Expenses
      let transport = 0, utilities = 0, officeSalaries = 0, repairs = 0, miscellaneous = 0;
      expensesData?.forEach(e => {
        const amount = Number(e.amount);
        switch (e.expense_type.toLowerCase()) {
          case 'transport': transport += amount; break;
          case 'utilities': utilities += amount; break;
          case 'office salaries':
          case 'salaries': officeSalaries += amount; break;
          case 'repairs': repairs += amount; break;
          default: miscellaneous += amount;
        }
      });
      const totalExpenses = transport + utilities + officeSalaries + repairs + miscellaneous;

      // Calculate Net Profit
      const netProfit = totalRevenue - totalCOGS - totalPayments - totalExpenses;

      setReportData({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        production: {
          totalPunches,
          byType: Array.from(productionByType.values())
        },
        sales: {
          totalRevenue,
          totalQtySold,
          outstandingBalance,
          records: salesData || []
        },
        materials: {
          purchased: Array.from(purchasesByMaterial.values()),
          used: Array.from(usageByMaterial.values()),
          totalPurchaseCost
        },
        payments: {
          salary,
          advance,
          bonus,
          incentive,
          total: totalPayments,
          records: paymentsData || []
        },
        cogs: {
          materialCost: totalPurchaseCost,
          productionWages,
          loadingWages,
          totalCOGS
        },
        expenses: {
          transport,
          utilities,
          salaries: officeSalaries,
          repairs,
          miscellaneous,
          total: totalExpenses,
          records: expensesData || []
        },
        netProfit,
        productionRecords: productionData || [],
        purchaseRecords: purchasesData || [],
        usageRecords: usageData || []
      });

      toast({ title: 'Report generated successfully' });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({ title: 'Error generating report', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const lines: string[] = [];
    
    // Header
    lines.push('BricksFlow - Detailed Report');
    lines.push(`Period: ${formatDate(reportData.startDate)} to ${formatDate(reportData.endDate)}`);
    lines.push('');
    
    // Summary Section
    lines.push('=== SUMMARY ===');
    lines.push(`Net Profit,${reportData.netProfit}`);
    lines.push(`Total Revenue,${reportData.sales.totalRevenue}`);
    lines.push(`Total COGS,${reportData.cogs.totalCOGS}`);
    lines.push(`Total Payments,${reportData.payments.total}`);
    lines.push(`Total Expenses,${reportData.expenses.total}`);
    lines.push('');

    // Production Records Section
    lines.push('=== PRODUCTION RECORDS ===');
    lines.push('Date,Product,Quantity,Punches,Remarks');
    reportData.productionRecords.forEach(p => {
      lines.push(`${p.date},${p.product_definitions?.name || p.product_name},${p.quantity},${p.punches || ''},${p.remarks || ''}`);
    });
    lines.push('');

    // Sales Records Section
    lines.push('=== SALES RECORDS ===');
    lines.push('Date,Customer,Phone,Product,Quantity,Rate,Total,Received,Balance,Notes');
    reportData.sales.records.forEach(s => {
      lines.push(`${s.date},${s.customer_name},${s.customer_phone || ''},${s.product_definitions?.name || ''},${s.quantity_sold},${s.rate_per_brick},${s.total_amount},${s.amount_received},${s.balance_due},${s.notes || ''}`);
    });
    lines.push('');

    // Material Purchases Section
    lines.push('=== MATERIAL PURCHASES ===');
    lines.push('Date,Material,Supplier,Quantity,Unit Cost,Total Cost,Payment Made,Notes');
    reportData.purchaseRecords.forEach(p => {
      const totalCost = Number(p.quantity_purchased) * Number(p.unit_cost);
      lines.push(`${p.date},${p.materials?.material_name || ''},${p.supplier_name},${p.quantity_purchased},${p.unit_cost},${totalCost},${p.payment_made || 0},${p.notes || ''}`);
    });
    lines.push('');

    // Material Usage Section
    lines.push('=== MATERIAL USAGE ===');
    lines.push('Date,Material,Quantity,Purpose');
    reportData.usageRecords.forEach(u => {
      lines.push(`${u.date},${u.materials?.material_name || ''},${u.quantity_used},${u.purpose}`);
    });
    lines.push('');

    // Employee Payments Section
    lines.push('=== EMPLOYEE PAYMENTS ===');
    lines.push('Date,Employee,Type,Amount,Notes');
    reportData.payments.records.forEach(p => {
      lines.push(`${p.date},${p.employee_name},${p.payment_type},${p.amount},${p.notes || ''}`);
    });
    lines.push('');

    // Expense Records Section
    lines.push('=== OTHER EXPENSES ===');
    lines.push('Date,Type,Description,Amount,Vendor,Receipt,Notes');
    reportData.expenses.records.forEach(e => {
      lines.push(`${e.date},${e.expense_type},${e.description},${e.amount},${e.vendor_name || ''},${e.receipt_number || ''},${e.notes || ''}`);
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brickworks-report-${reportData.startDate}-to-${reportData.endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({ title: 'Report exported successfully' });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          {reportData && (
            <Button onClick={exportToCSV} className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Date Range Selector */}
        <Card className="card-dark">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Choose Dates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                    className="input-dark"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                    className="input-dark"
                  />
                </div>
              </div>
              <Button onClick={generateReport} disabled={loading} className="btn-primary w-full md:w-auto">
                <FileText className="h-4 w-4 mr-2" />
                {loading ? 'Generating...' : 'Show Report'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {reportData && (
          <>
            {/* Profit/Loss Summary - TOP */}
            <Card className="card-metric border-2 border-primary">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center text-xl">
                  <DollarSign className="h-6 w-6 mr-2" />
                  Profit/Loss Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <p className="text-muted-foreground text-sm mb-2">Net Profit</p>
                  <p className={`text-4xl font-bold ${reportData.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(reportData.netProfit)}
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Revenue</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(reportData.sales.totalRevenue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">COGS</p>
                    <p className="text-lg font-bold text-destructive">-{formatCurrency(reportData.cogs.totalCOGS)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Payments</p>
                    <p className="text-lg font-bold text-warning">-{formatCurrency(reportData.payments.total)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground text-xs">Expenses</p>
                    <p className="text-lg font-bold text-warning">-{formatCurrency(reportData.expenses.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Production Summary */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Factory className="h-5 w-5 mr-2 text-primary" />
                  Production Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-muted/20 rounded-lg p-4 text-center">
                    <p className="text-secondary text-sm font-medium">Total Punches</p>
                    <p className="text-2xl font-bold text-foreground">{reportData.production.totalPunches.toLocaleString()}</p>
                  </div>
                  {reportData.production.byType.map((type, i) => (
                    <div key={i} className="bg-muted/20 rounded-lg p-4 text-center">
                      <p className="text-secondary text-sm font-medium">{type.name}</p>
                      <p className="text-2xl font-bold text-foreground">{type.quantity.toLocaleString()}</p>
                      <p className="text-xs text-secondary">{type.punches} punches</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sales Performance */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-success" />
                  Sales Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-success/10 rounded-lg p-4 text-center">
                    <p className="text-secondary text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(reportData.sales.totalRevenue)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-4 text-center">
                    <p className="text-secondary text-sm font-medium">Qty Sold</p>
                    <p className="text-2xl font-bold text-foreground">{reportData.sales.totalQtySold.toLocaleString()}</p>
                  </div>
                  <div className="bg-warning/10 rounded-lg p-4 text-center">
                    <p className="text-secondary text-sm font-medium">Outstanding</p>
                    <p className="text-2xl font-bold text-warning">{formatCurrency(reportData.sales.outstandingBalance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Materials Consumption */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Package className="h-5 w-5 mr-2 text-primary" />
                  Materials Consumption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-foreground font-semibold">Material</th>
                        <th className="text-right py-2 text-foreground font-semibold">Purchased</th>
                        <th className="text-right py-2 text-foreground font-semibold">Used</th>
                        <th className="text-right py-2 text-foreground font-semibold">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.materials.purchased.map((m, i) => {
                        const used = reportData.materials.used.find(u => u.name === m.name)?.quantity || 0;
                        return (
                          <tr key={i} className="border-b border-border/50">
                            <td className="py-2 text-foreground">{m.name}</td>
                            <td className="py-2 text-right text-foreground">{m.quantity.toLocaleString()}</td>
                            <td className="py-2 text-right text-foreground">{used.toLocaleString()}</td>
                            <td className="py-2 text-right text-destructive">{formatCurrency(m.cost)}</td>
                          </tr>
                        );
                      })}
                      <tr className="font-bold">
                        <td colSpan={3} className="py-2 text-foreground">Total Material Cost</td>
                        <td className="py-2 text-right text-destructive">{formatCurrency(reportData.materials.totalPurchaseCost)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Employee Payments */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Users className="h-5 w-5 mr-2 text-warning" />
                  Employee Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Salary</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.payments.salary)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Advance</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.payments.advance)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Bonus</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.payments.bonus)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Incentive</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.payments.incentive)}</p>
                  </div>
                  <div className="bg-warning/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Total</p>
                    <p className="text-lg font-bold text-warning">{formatCurrency(reportData.payments.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* COGS Breakdown */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-destructive" />
                  Production Costs (COGS)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Material Costs</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.cogs.materialCost)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Production Wages</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.cogs.productionWages)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Loading Wages</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.cogs.loadingWages)}</p>
                  </div>
                  <div className="bg-destructive/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Total COGS</p>
                    <p className="text-lg font-bold text-destructive">{formatCurrency(reportData.cogs.totalCOGS)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Operating Expenses */}
            <Card className="card-dark">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-warning" />
                  Operating Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Transport</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.expenses.transport)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Utilities</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.expenses.utilities)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Salaries</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.expenses.salaries)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Repairs</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.expenses.repairs)}</p>
                  </div>
                  <div className="bg-muted/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Misc</p>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(reportData.expenses.miscellaneous)}</p>
                  </div>
                  <div className="bg-warning/20 rounded-lg p-3 text-center">
                    <p className="text-secondary text-xs font-medium">Total</p>
                    <p className="text-lg font-bold text-warning">{formatCurrency(reportData.expenses.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Overview */}
            <Card className="card-metric border-2 border-success">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center text-xl">
                  <Building className="h-6 w-6 mr-2" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-foreground">Total Revenue</span>
                    <span className="text-xl font-bold text-success">{formatCurrency(reportData.sales.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-foreground">- Production Costs (COGS)</span>
                    <span className="text-lg font-semibold text-destructive">-{formatCurrency(reportData.cogs.totalCOGS)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-foreground">- Employee Payments</span>
                    <span className="text-lg font-semibold text-warning">-{formatCurrency(reportData.payments.total)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-foreground">- Operating Expenses</span>
                    <span className="text-lg font-semibold text-warning">-{formatCurrency(reportData.expenses.total)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 bg-muted/20 rounded-lg px-4">
                    <span className="text-lg font-bold text-foreground">= Net Profit</span>
                    <span className={`text-2xl font-bold ${reportData.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(reportData.netProfit)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsModule;

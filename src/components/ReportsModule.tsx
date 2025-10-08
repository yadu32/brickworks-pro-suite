import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Package, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WeeklyReport {
  startDate: string;
  endDate: string;
  production: {
    fourInch: number;
    sixInch: number;
    total: number;
    totalPunches: number;
    fourInchPunches: number;
    sixInchPunches: number;
  };
  sales: {
    totalRevenue: number;
    totalQuantity: number;
    outstandingBalance: number;
  };
  materials: {
    cement: { purchased: number; used: number; cost: number };
    dust: { purchased: number; used: number; cost: number };
    diesel: { purchased: number; used: number; cost: number };
  };
  payments: {
    salary: number;
    advance: number;
    bonus: number;
    incentive: number;
    total: number;
  };
  cogs: {
    materialCosts: number;
    productionWages: number;
    loadingWages: number;
    totalCOGS: number;
  };
  otherExpenses: {
    transport: number;
    utilities: number;
    officeSalaries: number;
    repairs: number;
    miscellaneous: number;
    total: number;
  };
}

const ReportsModule = () => {
  const [reportData, setReportData] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: (() => {
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(date.setDate(diff));
      return monday.toISOString().split('T')[0];
    })(),
    endDate: (() => {
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? 0 : 7); // Sunday
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

  const generateReport = async () => {
    setLoading(true);
    try {
      // Get brick types
      const { data: brickTypes } = await supabase
        .from('brick_types')
        .select('*');

      const fourInchType = brickTypes?.find(bt => bt.type_name.toLowerCase().includes('4-inch') || bt.type_name.toLowerCase().includes('4 inch'));
      const sixInchType = brickTypes?.find(bt => bt.type_name.toLowerCase().includes('6-inch') || bt.type_name.toLowerCase().includes('6 inch'));

      // Production data
      const { data: productionData } = await supabase
        .from('bricks_production')
        .select('*, brick_types(*)')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      const totalPunches = productionData?.reduce((sum, p) => sum + p.number_of_punches, 0) || 0;
      const fourInchPunches = productionData?.filter(p => p.brick_type_id === fourInchType?.id)
        .reduce((sum, p) => sum + p.number_of_punches, 0) || 0;
      const sixInchPunches = productionData?.filter(p => p.brick_type_id === sixInchType?.id)
        .reduce((sum, p) => sum + p.number_of_punches, 0) || 0;
      
      const production = {
        fourInch: productionData?.filter(p => p.brick_type_id === fourInchType?.id)
          .reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0,
        sixInch: productionData?.filter(p => p.brick_type_id === sixInchType?.id)
          .reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0,
        total: productionData?.reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0,
        totalPunches,
        fourInchPunches,
        sixInchPunches
      };

      // Sales data
      const { data: salesData } = await supabase
        .from('sales')
        .select('*')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      const sales = {
        totalRevenue: salesData?.reduce((sum, s) => sum + s.total_amount, 0) || 0,
        totalQuantity: salesData?.reduce((sum, s) => sum + s.quantity_sold, 0) || 0,
        outstandingBalance: salesData?.reduce((sum, s) => sum + s.balance_due, 0) || 0
      };

      // Materials data
      const { data: materialsData } = await supabase
        .from('materials')
        .select('*');

      const { data: purchasesData } = await supabase
        .from('material_purchases')
        .select('*, materials(*)')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      const { data: usageData } = await supabase
        .from('material_usage')
        .select('*, materials(*)')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      const getMaterialData = (materialName: string) => {
        const purchases = purchasesData?.filter(p => p.materials?.material_name?.toLowerCase().includes(materialName.toLowerCase())) || [];
        const usage = usageData?.filter(u => u.materials?.material_name?.toLowerCase().includes(materialName.toLowerCase())) || [];
        
        return {
          purchased: purchases.reduce((sum, p) => sum + Number(p.quantity_purchased), 0),
          used: usage.reduce((sum, u) => sum + Number(u.quantity_used), 0),
          cost: purchases.reduce((sum, p) => sum + (Number(p.quantity_purchased) * Number(p.unit_cost)), 0)
        };
      };

      const materials = {
        cement: getMaterialData('Cement'),
        dust: getMaterialData('Dust'),
        diesel: getMaterialData('Diesel')
      };

      // Payments data
      const { data: paymentsData } = await supabase
        .from('employee_payments')
        .select('*')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      const payments = {
        salary: paymentsData?.filter(p => p.payment_type === 'Salary').reduce((sum, p) => sum + p.amount, 0) || 0,
        advance: paymentsData?.filter(p => p.payment_type === 'Advance').reduce((sum, p) => sum + p.amount, 0) || 0,
        bonus: paymentsData?.filter(p => p.payment_type === 'Bonus').reduce((sum, p) => sum + p.amount, 0) || 0,
        incentive: paymentsData?.filter(p => p.payment_type === 'Incentive').reduce((sum, p) => sum + p.amount, 0) || 0,
        total: paymentsData?.reduce((sum, p) => sum + p.amount, 0) || 0
      };

      // Get factory rates for COGS calculation
      const { data: ratesData } = await supabase
        .from("factory_rates")
        .select("*")
        .eq("is_active", true);

      const productionRate = ratesData?.find((r) => r.rate_type === "production_per_punch")?.rate_amount || 15;
      const loadingRate = ratesData?.find((r) => r.rate_type === "loading_per_brick")?.rate_amount || 2;

      // Calculate COGS
      const materialCosts = materials.cement.cost + materials.dust.cost + materials.diesel.cost;
      const productionWages = totalPunches * productionRate;
      const loadingWages = sales.totalQuantity * loadingRate;
      const totalCOGS = materialCosts + productionWages + loadingWages;

      const cogs = {
        materialCosts,
        productionWages,
        loadingWages,
        totalCOGS
      };

      // Other Expenses data
      const { data: expensesData } = await supabase
        .from('other_expenses')
        .select('*')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate);

      const otherExpenses = {
        transport: expensesData?.filter(e => e.expense_type === 'Transport').reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        utilities: expensesData?.filter(e => e.expense_type === 'Utilities').reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        officeSalaries: expensesData?.filter(e => e.expense_type === 'Office Salaries').reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        repairs: expensesData?.filter(e => e.expense_type === 'Repairs & Maintenance').reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        miscellaneous: expensesData?.filter(e => e.expense_type === 'Miscellaneous').reduce((sum, e) => sum + Number(e.amount), 0) || 0,
        total: expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0
      };

      setReportData({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        production,
        sales,
        materials,
        payments,
        cogs,
        otherExpenses
      });

      toast({ title: 'Report generated successfully' });
    } catch (error) {
      toast({ title: 'Error generating report', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csv = [
      ['BrickWorks Manager - Weekly Report'],
      [`Period: ${new Date(reportData.startDate).toLocaleDateString()} to ${new Date(reportData.endDate).toLocaleDateString()}`],
      [''],
      ['PRODUCTION SUMMARY'],
      ['Brick Type', 'Quantity Produced'],
      ['4-inch Bricks', reportData.production.fourInch.toString()],
      ['6-inch Bricks', reportData.production.sixInch.toString()],
      ['Total Production', reportData.production.total.toString()],
      [''],
      ['SALES SUMMARY'],
      ['Metric', 'Value'],
      ['Total Revenue', reportData.sales.totalRevenue.toString()],
      ['Total Quantity Sold', reportData.sales.totalQuantity.toString()],
      ['Outstanding Balance', reportData.sales.outstandingBalance.toString()],
      [''],
      ['MATERIALS SUMMARY'],
      ['Material', 'Purchased', 'Used', 'Cost'],
      ['Cement', reportData.materials.cement.purchased.toString(), reportData.materials.cement.used.toString(), reportData.materials.cement.cost.toString()],
      ['Dust', reportData.materials.dust.purchased.toString(), reportData.materials.dust.used.toString(), reportData.materials.dust.cost.toString()],
      ['Diesel', reportData.materials.diesel.purchased.toString(), reportData.materials.diesel.used.toString(), reportData.materials.diesel.cost.toString()],
      [''],
      ['EMPLOYEE PAYMENTS'],
      ['Payment Type', 'Amount'],
      ['Salary', reportData.payments.salary.toString()],
      ['Advance', reportData.payments.advance.toString()],
      ['Bonus', reportData.payments.bonus.toString()],
      ['Incentive', reportData.payments.incentive.toString()],
      ['Total Payments', reportData.payments.total.toString()]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weekly-report-${reportData.startDate}-to-${reportData.endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({ title: 'Report exported successfully' });
  };

  useEffect(() => {
    generateReport();
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">Weekly Reports</h1>
          {reportData && (
            <Button onClick={exportToCSV} className="btn-secondary">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Date Range Selector */}
        <section className="animate-fade-in">
          <Card className="card-dark">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Select Report Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-end">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  />
                </div>
                <Button onClick={generateReport} disabled={loading} className="btn-primary">
                  <FileText className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {reportData && (
          <>
            {/* Report Header */}
            <section className="animate-slide-up">
              <Card className="card-metric">
                <CardContent className="p-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-foreground mb-2">BrickWorks Manager</h2>
                    <h3 className="text-xl text-secondary mb-4">Weekly Report</h3>
                    <p className="text-foreground">
                      Period: {new Date(reportData.startDate).toLocaleDateString('en-IN')} to {new Date(reportData.endDate).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Punch Count Header Cards */}
            <section className="animate-fade-in">
              <Card className="card-metric">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <Package className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-secondary">Total Punches</p>
                      <p className="text-3xl font-bold text-primary">{reportData.production.totalPunches.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <Package className="h-8 w-8 text-success mx-auto mb-2" />
                      <p className="text-secondary">4-inch Punches</p>
                      <p className="text-2xl font-bold text-success">{reportData.production.fourInchPunches.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <Package className="h-8 w-8 text-warning mx-auto mb-2" />
                      <p className="text-secondary">6-inch Punches</p>
                      <p className="text-2xl font-bold text-warning">{reportData.production.sixInchPunches.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Production Summary */}
            <section className="animate-fade-in">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Production Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-secondary">4-inch Bricks</p>
                      <p className="text-2xl font-bold text-primary">{reportData.production.fourInch.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">6-inch Bricks</p>
                      <p className="text-2xl font-bold text-success">{reportData.production.sixInch.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Total Production</p>
                      <p className="text-2xl font-bold text-foreground">{reportData.production.total.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Sales Summary */}
            <section className="animate-slide-up">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Sales Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-secondary">Total Revenue</p>
                      <p className="text-2xl font-bold text-success">{formatCurrency(reportData.sales.totalRevenue)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Total Quantity Sold</p>
                      <p className="text-2xl font-bold text-foreground">{reportData.sales.totalQuantity.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Outstanding Balance</p>
                      <p className="text-2xl font-bold text-warning">{formatCurrency(reportData.sales.outstandingBalance)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Materials Summary */}
            <section className="animate-fade-in">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Materials Consumption & Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-secondary">Material</th>
                          <th className="text-left py-3 px-4 text-secondary">Purchased</th>
                          <th className="text-left py-3 px-4 text-secondary">Used</th>
                          <th className="text-left py-3 px-4 text-secondary">Cost</th>
                          <th className="text-left py-3 px-4 text-secondary">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-foreground font-medium">Cement</td>
                          <td className="py-3 px-4 text-foreground">{reportData.materials.cement.purchased} bags</td>
                          <td className="py-3 px-4 text-foreground">{reportData.materials.cement.used} bags</td>
                          <td className="py-3 px-4 text-foreground">{formatCurrency(reportData.materials.cement.cost)}</td>
                          <td className="py-3 px-4 text-foreground">
                            {reportData.materials.cement.purchased > 0 
                              ? `${((reportData.materials.cement.used / reportData.materials.cement.purchased) * 100).toFixed(1)}%`
                              : 'N/A'
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-foreground font-medium">Dust</td>
                          <td className="py-3 px-4 text-foreground">{reportData.materials.dust.purchased} tons</td>
                          <td className="py-3 px-4 text-foreground">{reportData.materials.dust.used} tons</td>
                          <td className="py-3 px-4 text-foreground">{formatCurrency(reportData.materials.dust.cost)}</td>
                          <td className="py-3 px-4 text-foreground">
                            {reportData.materials.dust.purchased > 0 
                              ? `${((reportData.materials.dust.used / reportData.materials.dust.purchased) * 100).toFixed(1)}%`
                              : 'N/A'
                            }
                          </td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-foreground font-medium">Diesel</td>
                          <td className="py-3 px-4 text-foreground">{reportData.materials.diesel.purchased} liters</td>
                          <td className="py-3 px-4 text-foreground">{reportData.materials.diesel.used} liters</td>
                          <td className="py-3 px-4 text-foreground">{formatCurrency(reportData.materials.diesel.cost)}</td>
                          <td className="py-3 px-4 text-foreground">
                            {reportData.materials.diesel.purchased > 0 
                              ? `${((reportData.materials.diesel.used / reportData.materials.diesel.purchased) * 100).toFixed(1)}%`
                              : 'N/A'
                            }
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Employee Payments Summary */}
            <section className="animate-slide-up">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Employee Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <div className="text-center">
                      <p className="text-secondary">Salary</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(reportData.payments.salary)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Advance</p>
                      <p className="text-xl font-bold text-warning">{formatCurrency(reportData.payments.advance)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Bonus</p>
                      <p className="text-xl font-bold text-success">{formatCurrency(reportData.payments.bonus)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Incentive</p>
                      <p className="text-xl font-bold text-secondary">{formatCurrency(reportData.payments.incentive)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Total</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(reportData.payments.total)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* COGS Breakdown */}
            <section className="animate-fade-in">
              <Card className="card-metric">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Cost of Goods Sold (COGS) Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <p className="text-secondary">Material Costs</p>
                        <p className="text-2xl font-bold text-warning">{formatCurrency(reportData.cogs.materialCosts)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-secondary">Production Wages</p>
                        <p className="text-2xl font-bold text-warning">{formatCurrency(reportData.cogs.productionWages)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reportData.production.totalPunches} punches
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-secondary">Loading Wages</p>
                        <p className="text-2xl font-bold text-warning">{formatCurrency(reportData.cogs.loadingWages)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {reportData.sales.totalQuantity} bricks
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-secondary">Total COGS</p>
                        <p className="text-2xl font-bold text-destructive">{formatCurrency(reportData.cogs.totalCOGS)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Operating Expenses */}
            <section className="animate-fade-in">
              <Card className="card-dark">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Operating Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-secondary">Category</th>
                          <th className="text-left py-3 px-4 text-secondary">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-foreground">Transport</td>
                          <td className="py-3 px-4 text-foreground">{formatCurrency(reportData.otherExpenses.transport)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-foreground">Utilities</td>
                          <td className="py-3 px-4 text-foreground">{formatCurrency(reportData.otherExpenses.utilities)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-foreground">Office Salaries</td>
                          <td className="py-3 px-4 text-foreground">{formatCurrency(reportData.otherExpenses.officeSalaries)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-foreground">Repairs & Maintenance</td>
                          <td className="py-3 px-4 text-foreground">{formatCurrency(reportData.otherExpenses.repairs)}</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-3 px-4 text-foreground">Miscellaneous</td>
                          <td className="py-3 px-4 text-foreground">{formatCurrency(reportData.otherExpenses.miscellaneous)}</td>
                        </tr>
                        <tr className="border-t-2 border-primary">
                          <td className="py-3 px-4 text-foreground font-bold">Total Operating Expenses</td>
                          <td className="py-3 px-4 text-destructive font-bold">{formatCurrency(reportData.otherExpenses.total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Financial Overview */}
            <section className="animate-fade-in">
              <Card className="card-metric">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    <div className="text-center">
                      <p className="text-secondary">Total Revenue</p>
                      <p className="text-2xl font-bold text-success">{formatCurrency(reportData.sales.totalRevenue)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Total COGS</p>
                      <p className="text-2xl font-bold text-destructive">{formatCurrency(reportData.cogs.totalCOGS)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Employee Payments</p>
                      <p className="text-2xl font-bold text-warning">{formatCurrency(reportData.payments.total)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Operating Expenses</p>
                      <p className="text-2xl font-bold text-warning">{formatCurrency(reportData.otherExpenses.total)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-secondary">Net Profit</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(
                          reportData.sales.totalRevenue - reportData.cogs.totalCOGS - reportData.payments.total - reportData.otherExpenses.total
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reportData.sales.totalRevenue > 0 
                          ? `${(((reportData.sales.totalRevenue - reportData.cogs.totalCOGS - reportData.payments.total - reportData.otherExpenses.total) / reportData.sales.totalRevenue) * 100).toFixed(1)}% margin`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsModule;
import { useState, useEffect } from 'react';
import { FileText, Download, Calendar, TrendingUp, Package, Users, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DailyData {
  date: string;
  production: { brickType: string; quantity: number; punches: number }[];
  sales: { customer: string; product: string; quantity: number; amount: number }[];
  materialPurchases: { material: string; quantity: number; cost: number }[];
  materialUsage: { material: string; quantity: number; purpose: string }[];
  payments: { employee: string; type: string; amount: number }[];
  expenses: { type: string; description: string; amount: number }[];
}

interface WeeklyReport {
  startDate: string;
  endDate: string;
  dailyData: DailyData[];
  totals: {
    production: number;
    sales: number;
    materialCost: number;
    payments: number;
    expenses: number;
    netProfit: number;
  };
}

const ReportsModule = () => {
  const [reportData, setReportData] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
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
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const toggleDay = (date: string) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // Get brick types
      const { data: brickTypes } = await supabase.from('brick_types').select('*');
      const { data: materials } = await supabase.from('materials').select('*');

      // Fetch all data for date range
      const { data: productionData } = await supabase
        .from('bricks_production')
        .select('*, brick_types(*)')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      const { data: salesData } = await supabase
        .from('sales')
        .select('*, brick_types:product_id(type_name)')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      const { data: purchasesData } = await supabase
        .from('material_purchases')
        .select('*, materials(*)')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      const { data: usageData } = await supabase
        .from('material_usage')
        .select('*, materials(*)')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      const { data: paymentsData } = await supabase
        .from('employee_payments')
        .select('*')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      const { data: expensesData } = await supabase
        .from('other_expenses')
        .select('*')
        .gte('date', dateRange.startDate)
        .lte('date', dateRange.endDate)
        .order('date');

      // Generate dates in range
      const dates: string[] = [];
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0]);
      }

      // Organize data by day
      const dailyData: DailyData[] = dates.map(date => ({
        date,
        production: productionData?.filter(p => p.date === date).map(p => ({
          brickType: p.brick_types?.type_name || 'Unknown',
          quantity: p.actual_bricks_produced,
          punches: p.number_of_punches
        })) || [],
        sales: salesData?.filter(s => s.date === date).map(s => ({
          customer: s.customer_name,
          product: (s.brick_types as any)?.type_name || 'Unknown',
          quantity: s.quantity_sold,
          amount: Number(s.total_amount)
        })) || [],
        materialPurchases: purchasesData?.filter(p => p.date === date).map(p => ({
          material: p.materials?.material_name || 'Unknown',
          quantity: Number(p.quantity_purchased),
          cost: Number(p.quantity_purchased) * Number(p.unit_cost)
        })) || [],
        materialUsage: usageData?.filter(u => u.date === date).map(u => ({
          material: u.materials?.material_name || 'Unknown',
          quantity: Number(u.quantity_used),
          purpose: u.purpose
        })) || [],
        payments: paymentsData?.filter(p => p.date === date).map(p => ({
          employee: p.employee_name,
          type: p.payment_type,
          amount: Number(p.amount)
        })) || [],
        expenses: expensesData?.filter(e => e.date === date).map(e => ({
          type: e.expense_type,
          description: e.description,
          amount: Number(e.amount)
        })) || []
      }));

      // Calculate totals
      const totalProduction = productionData?.reduce((sum, p) => sum + p.actual_bricks_produced, 0) || 0;
      const totalSales = salesData?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalMaterialCost = purchasesData?.reduce((sum, p) => sum + Number(p.quantity_purchased) * Number(p.unit_cost), 0) || 0;
      const totalPayments = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const netProfit = totalSales - totalMaterialCost - totalPayments - totalExpenses;

      setReportData({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        dailyData,
        totals: {
          production: totalProduction,
          sales: totalSales,
          materialCost: totalMaterialCost,
          payments: totalPayments,
          expenses: totalExpenses,
          netProfit
        }
      });

      // Expand all days by default
      const expanded: Record<string, boolean> = {};
      dates.forEach(d => expanded[d] = true);
      setExpandedDays(expanded);

      toast({ title: 'Report generated successfully' });
    } catch (error) {
      toast({ title: 'Error generating report', description: 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const rows: string[][] = [
      ['BrickWorks Manager - Daily Report'],
      [`Period: ${formatDate(reportData.startDate)} to ${formatDate(reportData.endDate)}`],
      [''],
    ];

    reportData.dailyData.forEach(day => {
      rows.push([`=== ${formatDate(day.date)} ===`]);
      
      if (day.production.length) {
        rows.push(['Production:']);
        day.production.forEach(p => rows.push(['', p.brickType, `${p.quantity} pcs`, `${p.punches} punches`]));
      }
      if (day.sales.length) {
        rows.push(['Sales:']);
        day.sales.forEach(s => rows.push(['', s.customer, s.product, `${s.quantity} pcs`, s.amount.toString()]));
      }
      if (day.materialPurchases.length) {
        rows.push(['Material Purchases:']);
        day.materialPurchases.forEach(m => rows.push(['', m.material, m.quantity.toString(), m.cost.toString()]));
      }
      if (day.payments.length) {
        rows.push(['Payments:']);
        day.payments.forEach(p => rows.push(['', p.employee, p.type, p.amount.toString()]));
      }
      if (day.expenses.length) {
        rows.push(['Expenses:']);
        day.expenses.forEach(e => rows.push(['', e.type, e.description, e.amount.toString()]));
      }
      rows.push(['']);
    });

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${reportData.startDate}-to-${reportData.endDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({ title: 'Report exported successfully' });
  };

  useEffect(() => {
    generateReport();
  }, []);

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
              <div className="flex gap-4">
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
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="text-center">
                    <p className="text-secondary text-sm">Production</p>
                    <p className="text-xl font-bold text-foreground">{reportData.totals.production.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-secondary text-sm">Sales</p>
                    <p className="text-xl font-bold text-success">{formatCurrency(reportData.totals.sales)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-secondary text-sm">Material Cost</p>
                    <p className="text-xl font-bold text-destructive">{formatCurrency(reportData.totals.materialCost)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-secondary text-sm">Payments</p>
                    <p className="text-xl font-bold text-warning">{formatCurrency(reportData.totals.payments)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-secondary text-sm">Expenses</p>
                    <p className="text-xl font-bold text-warning">{formatCurrency(reportData.totals.expenses)}</p>
                  </div>
                  <div className="text-center bg-muted/30 rounded-lg p-2">
                    <p className="text-secondary text-sm font-semibold">Net Profit</p>
                    <p className={`text-2xl font-bold ${reportData.totals.netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {formatCurrency(reportData.totals.netProfit)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Breakdown */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Daily Breakdown</h2>
              
              {reportData.dailyData.map((day) => {
                const dayTotal = day.sales.reduce((s, sale) => s + sale.amount, 0);
                const dayExpense = day.materialPurchases.reduce((s, m) => s + m.cost, 0) +
                                   day.payments.reduce((s, p) => s + p.amount, 0) +
                                   day.expenses.reduce((s, e) => s + e.amount, 0);
                const hasData = day.production.length || day.sales.length || day.materialPurchases.length || 
                               day.materialUsage.length || day.payments.length || day.expenses.length;

                return (
                  <Collapsible key={day.date} open={expandedDays[day.date]} onOpenChange={() => toggleDay(day.date)}>
                    <Card className="card-dark">
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-foreground flex items-center">
                              <Calendar className="h-5 w-5 mr-2" />
                              {formatDate(day.date)}
                            </CardTitle>
                            <div className="flex items-center gap-4">
                              {hasData ? (
                                <>
                                  <span className="text-success text-sm">{formatCurrency(dayTotal)}</span>
                                  <span className="text-destructive text-sm">-{formatCurrency(dayExpense)}</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-sm">No entries</span>
                              )}
                              {expandedDays[day.date] ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="space-y-4">
                          {/* Production */}
                          {day.production.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-primary mb-2 flex items-center">
                                <Package className="h-4 w-4 mr-1" /> Production
                              </h4>
                              <div className="space-y-1">
                                {day.production.map((p, i) => (
                                  <div key={i} className="flex justify-between text-sm text-foreground bg-muted/10 p-2 rounded">
                                    <span>{p.brickType}</span>
                                    <span>{p.quantity.toLocaleString()} pcs ({p.punches} punches)</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Sales */}
                          {day.sales.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-success mb-2 flex items-center">
                                <TrendingUp className="h-4 w-4 mr-1" /> Sales
                              </h4>
                              <div className="space-y-1">
                                {day.sales.map((s, i) => (
                                  <div key={i} className="flex justify-between text-sm text-foreground bg-muted/10 p-2 rounded">
                                    <span>{s.customer} - {s.product}</span>
                                    <span>{s.quantity} pcs = {formatCurrency(s.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Material Purchases */}
                          {day.materialPurchases.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-warning mb-2 flex items-center">
                                <Package className="h-4 w-4 mr-1" /> Material Purchases
                              </h4>
                              <div className="space-y-1">
                                {day.materialPurchases.map((m, i) => (
                                  <div key={i} className="flex justify-between text-sm text-foreground bg-muted/10 p-2 rounded">
                                    <span>{m.material}</span>
                                    <span>{m.quantity} = {formatCurrency(m.cost)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Material Usage */}
                          {day.materialUsage.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-secondary mb-2 flex items-center">
                                <Package className="h-4 w-4 mr-1" /> Material Usage
                              </h4>
                              <div className="space-y-1">
                                {day.materialUsage.map((m, i) => (
                                  <div key={i} className="flex justify-between text-sm text-foreground bg-muted/10 p-2 rounded">
                                    <span>{m.material} - {m.purpose}</span>
                                    <span>{m.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Payments */}
                          {day.payments.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center">
                                <Users className="h-4 w-4 mr-1" /> Payments
                              </h4>
                              <div className="space-y-1">
                                {day.payments.map((p, i) => (
                                  <div key={i} className="flex justify-between text-sm text-foreground bg-muted/10 p-2 rounded">
                                    <span>{p.employee} ({p.type})</span>
                                    <span>{formatCurrency(p.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Expenses */}
                          {day.expenses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" /> Other Expenses
                              </h4>
                              <div className="space-y-1">
                                {day.expenses.map((e, i) => (
                                  <div key={i} className="flex justify-between text-sm text-foreground bg-muted/10 p-2 rounded">
                                    <span>{e.type}: {e.description}</span>
                                    <span>{formatCurrency(e.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {!hasData && (
                            <p className="text-muted-foreground text-center py-4">No entries for this day</p>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsModule;

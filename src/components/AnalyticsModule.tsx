import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CustomerAnalytics {
  customer_name: string;
  total_revenue: number;
  total_quantity: number;
  total_payments: number;
  balance_due: number;
  avg_days_to_pay: number;
  sale_count: number;
}

export default function AnalyticsModule() {
  const [customerData, setCustomerData] = useState<CustomerAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data: sales, error } = await supabase
        .from("sales")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;

      const customerMap = new Map<string, CustomerAnalytics>();

      (sales || []).forEach((sale: any) => {
        const existing = customerMap.get(sale.customer_name) || {
          customer_name: sale.customer_name,
          total_revenue: 0,
          total_quantity: 0,
          total_payments: 0,
          balance_due: 0,
          avg_days_to_pay: 0,
          sale_count: 0,
        };

        customerMap.set(sale.customer_name, {
          customer_name: sale.customer_name,
          total_revenue: existing.total_revenue + sale.total_amount,
          total_quantity: existing.total_quantity + sale.quantity_sold,
          total_payments: existing.total_payments + sale.amount_received,
          balance_due: existing.balance_due + sale.balance_due,
          avg_days_to_pay: existing.avg_days_to_pay,
          sale_count: existing.sale_count + 1,
        });
      });

      const analyticsData = Array.from(customerMap.values()).sort(
        (a, b) => b.total_revenue - a.total_revenue
      );

      setCustomerData(analyticsData);
    } catch (error: any) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateMargin = (revenue: number, quantity: number) => {
    const avgRevenue = revenue / quantity;
    const estimatedCost = 8;
    const margin = ((avgRevenue - estimatedCost) / avgRevenue) * 100;
    return margin.toFixed(1);
  };

  const totalRevenue = customerData.reduce((sum, c) => sum + c.total_revenue, 0);
  const totalDue = customerData.reduce((sum, c) => sum + c.balance_due, 0);
  const topCustomers = customerData.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Advanced Analytics</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{formatCurrency(totalDue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">~35%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Quantity Sold</TableHead>
                  <TableHead>Payments Received</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead>Est. Margin %</TableHead>
                  <TableHead>Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCustomers.map((customer, idx) => (
                  <TableRow key={customer.customer_name}>
                    <TableCell className="font-bold">#{idx + 1}</TableCell>
                    <TableCell className="font-medium">{customer.customer_name}</TableCell>
                    <TableCell>{formatCurrency(customer.total_revenue)}</TableCell>
                    <TableCell>{customer.total_quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(customer.total_payments)}</TableCell>
                    <TableCell className="text-orange-600">{formatCurrency(customer.balance_due)}</TableCell>
                    <TableCell>{calculateMargin(customer.total_revenue, customer.total_quantity)}%</TableCell>
                    <TableCell>{customer.sale_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Customer Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead>Balance Due</TableHead>
                  <TableHead>DSO</TableHead>
                  <TableHead>Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerData.map((customer) => (
                  <TableRow key={customer.customer_name}>
                    <TableCell>{customer.customer_name}</TableCell>
                    <TableCell>{formatCurrency(customer.total_revenue)}</TableCell>
                    <TableCell>{customer.total_quantity.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(customer.total_payments)}</TableCell>
                    <TableCell className={customer.balance_due > 0 ? "text-orange-600" : ""}>
                      {formatCurrency(customer.balance_due)}
                    </TableCell>
                    <TableCell>
                      {customer.avg_days_to_pay ? `${customer.avg_days_to_pay} days` : "N/A"}
                    </TableCell>
                    <TableCell>{customer.sale_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

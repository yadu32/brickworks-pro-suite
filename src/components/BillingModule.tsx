import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeliveryChallan {
  id: string;
  challan_number: string;
  sale_id: string;
  truck_number: string;
  driver_name: string;
  driver_phone: string;
  delivery_address: string;
  quantity_delivered: number;
  delivery_date: string;
  status: string;
}

interface Sale {
  id: string;
  customer_name: string;
  quantity_sold: number;
  date: string;
}

export default function BillingModule() {
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    sale_id: '',
    truck_number: '',
    driver_name: '',
    driver_phone: '',
    delivery_address: '',
    quantity_delivered: 0,
    delivery_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadChallans();
    loadSales();
  }, []);

  const loadChallans = async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_challans" as any)
        .select("*")
        .order("delivery_date", { ascending: false });

      if (error) throw error;
      setChallans((data || []) as unknown as DeliveryChallan[]);
    } catch (error: any) {
      console.error("Error loading challans:", error);
    }
  };

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select("id, customer_name, quantity_sold, date")
        .order("date", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      console.error("Error loading sales:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const challanNumber = `DC-${Date.now()}`;
    
    try {
      const { error } = await supabase
        .from("delivery_challans" as any)
        .insert([{
          ...formData,
          challan_number: challanNumber,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({ title: "Delivery challan created successfully", description: `Challan #${challanNumber}` });
      setShowForm(false);
      setFormData({
        sale_id: '',
        truck_number: '',
        driver_name: '',
        driver_phone: '',
        delivery_address: '',
        quantity_delivered: 0,
        delivery_date: new Date().toISOString().split('T')[0]
      });
      loadChallans();
    } catch (error: any) {
      toast({ title: "Error creating challan", description: error.message, variant: "destructive" });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("delivery_challans" as any)
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Status updated successfully" });
      loadChallans();
    } catch (error: any) {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Billing & Delivery</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Delivery Challan"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Delivery Challan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Select Sale</Label>
                <Select value={formData.sale_id} onValueChange={(value) => setFormData({ ...formData, sale_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a sale..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sales.map((sale) => (
                      <SelectItem key={sale.id} value={sale.id}>
                        {sale.customer_name} - {sale.quantity_sold} bricks - {new Date(sale.date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Truck Number</Label>
                  <Input
                    value={formData.truck_number}
                    onChange={(e) => setFormData({ ...formData, truck_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Driver Name</Label>
                  <Input
                    value={formData.driver_name}
                    onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Driver Phone</Label>
                  <Input
                    value={formData.driver_phone}
                    onChange={(e) => setFormData({ ...formData, driver_phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Quantity Delivered</Label>
                  <Input
                    type="number"
                    value={formData.quantity_delivered}
                    onChange={(e) => setFormData({ ...formData, quantity_delivered: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Delivery Address</Label>
                <Textarea
                  value={formData.delivery_address}
                  onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Delivery Date</Label>
                <Input
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  required
                />
              </div>

              <Button type="submit">Create Challan</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Challans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challans.map((challan) => (
                  <TableRow key={challan.id}>
                    <TableCell className="font-mono">{challan.challan_number}</TableCell>
                    <TableCell>{new Date(challan.delivery_date).toLocaleDateString()}</TableCell>
                    <TableCell>{challan.truck_number}</TableCell>
                    <TableCell>
                      {challan.driver_name}
                      {challan.driver_phone && (
                        <div className="text-sm text-muted-foreground">{challan.driver_phone}</div>
                      )}
                    </TableCell>
                    <TableCell>{challan.quantity_delivered.toLocaleString()}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{challan.delivery_address}</TableCell>
                    <TableCell>
                      <Select value={challan.status} onValueChange={(value) => updateStatus(challan.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Print
                      </Button>
                    </TableCell>
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

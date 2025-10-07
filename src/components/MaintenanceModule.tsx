import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, Activity, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MaintenanceTicket {
  id: string;
  date: string;
  ticket_type: string;
  machine_name: string;
  description: string;
  downtime_minutes: number;
  parts_used: string;
  cost: number;
  status: string;
}

export default function MaintenanceModule() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    ticket_type: 'breakdown',
    machine_name: '',
    description: '',
    downtime_minutes: 0,
    parts_used: '',
    cost: 0,
    status: 'open'
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("maintenance_tickets" as any)
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTickets((data || []) as unknown as MaintenanceTicket[]);
    } catch (error: any) {
      console.error("Error loading tickets:", error);
      toast({ title: "Error loading maintenance tickets", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("maintenance_tickets" as any)
        .insert([formData]);

      if (error) throw error;

      toast({ title: "Maintenance ticket created successfully" });
      setShowForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        ticket_type: 'breakdown',
        machine_name: '',
        description: '',
        downtime_minutes: 0,
        parts_used: '',
        cost: 0,
        status: 'open'
      });
      loadTickets();
    } catch (error: any) {
      toast({ title: "Error creating ticket", description: error.message, variant: "destructive" });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("maintenance_tickets" as any)
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Status updated successfully" });
      loadTickets();
    } catch (error: any) {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const totalDowntime = tickets.reduce((sum, t) => sum + t.downtime_minutes, 0);
  const breakdownCount = tickets.filter(t => t.ticket_type === 'breakdown').length;
  const preventiveCount = tickets.filter(t => t.ticket_type === 'preventive').length;
  const availability = totalDowntime > 0 ? ((24 * 60 * 30 - totalDowntime) / (24 * 60 * 30) * 100).toFixed(1) : '100.0';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Maintenance & OEE Tracking</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "New Ticket"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Availability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{availability}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Downtime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDowntime} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Breakdowns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{breakdownCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preventive Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{preventiveCount}</div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Maintenance Ticket</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <Label>Type</Label>
                  <Select value={formData.ticket_type} onValueChange={(value) => setFormData({ ...formData, ticket_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakdown">Breakdown</SelectItem>
                      <SelectItem value="preventive">Preventive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Machine Name</Label>
                <Input
                  value={formData.machine_name}
                  onChange={(e) => setFormData({ ...formData, machine_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Downtime (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.downtime_minutes}
                    onChange={(e) => setFormData({ ...formData, downtime_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Cost (₹)</Label>
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Parts Used</Label>
                <Input
                  value={formData.parts_used}
                  onChange={(e) => setFormData({ ...formData, parts_used: e.target.value })}
                />
              </div>
              <Button type="submit">Create Ticket</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Downtime</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{new Date(ticket.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={ticket.ticket_type === 'breakdown' ? 'text-orange-500' : 'text-blue-500'}>
                        {ticket.ticket_type}
                      </span>
                    </TableCell>
                    <TableCell>{ticket.machine_name}</TableCell>
                    <TableCell>{ticket.description}</TableCell>
                    <TableCell>{ticket.downtime_minutes} min</TableCell>
                    <TableCell>₹{ticket.cost.toLocaleString()}</TableCell>
                    <TableCell>
                      <Select value={ticket.status} onValueChange={(value) => updateStatus(ticket.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {ticket.parts_used && (
                        <span className="text-sm text-muted-foreground">{ticket.parts_used}</span>
                      )}
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

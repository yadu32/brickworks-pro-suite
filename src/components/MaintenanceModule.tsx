import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Plus, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

interface MachineAsset {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
}

export default function MaintenanceModule() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [machines, setMachines] = useState<MachineAsset[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    ticket_type: "preventive",
    machine_name: "",
    description: "",
    downtime_minutes: 0,
    parts_used: "",
    cost: 0,
    status: "open",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadTickets();
    loadMachines();
  }, []);

  const loadTickets = async () => {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      toast({
        title: "Error loading tickets",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTickets(data || []);
    }
  };

  const loadMachines = async () => {
    const { data, error } = await supabase
      .from("machine_assets")
      .select("*")
      .eq("is_active", true);

    if (error) {
      toast({
        title: "Error loading machines",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setMachines(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("maintenance_tickets").insert([formData]);

    if (error) {
      toast({
        title: "Error creating ticket",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ticket created successfully",
      });
      setIsDialogOpen(false);
      loadTickets();
      setFormData({
        date: new Date().toISOString().split("T")[0],
        ticket_type: "preventive",
        machine_name: "",
        description: "",
        downtime_minutes: 0,
        parts_used: "",
        cost: 0,
        status: "open",
      });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("maintenance_tickets")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Status updated" });
      loadTickets();
    }
  };

  const calculateOEE = () => {
    const totalDowntime = tickets.reduce((sum, t) => sum + t.downtime_minutes, 0);
    const totalTime = 24 * 60 * 30; // 30 days in minutes
    const availability = ((totalTime - totalDowntime) / totalTime) * 100;
    return {
      availability: availability.toFixed(1),
      totalDowntime,
      breakdownCount: tickets.filter(t => t.ticket_type === "breakdown").length,
      preventiveCount: tickets.filter(t => t.ticket_type === "preventive").length,
    };
  };

  const oee = calculateOEE();

  const getStatusBadge = (status: string) => {
    const variants = {
      open: "destructive",
      in_progress: "default",
      closed: "secondary",
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Maintenance & OEE</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Maintenance Ticket</DialogTitle>
            </DialogHeader>
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
                  <Label>Ticket Type</Label>
                  <Select
                    value={formData.ticket_type}
                    onValueChange={(value) => setFormData({ ...formData, ticket_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="breakdown">Breakdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Machine</Label>
                <Select
                  value={formData.machine_name}
                  onValueChange={(value) => setFormData({ ...formData, machine_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((m) => (
                      <SelectItem key={m.id} value={m.name}>
                        {m.name} ({m.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the issue or maintenance task"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Downtime (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.downtime_minutes}
                    onChange={(e) => setFormData({ ...formData, downtime_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Parts Used</Label>
                  <Input
                    value={formData.parts_used}
                    onChange={(e) => setFormData({ ...formData, parts_used: e.target.value })}
                    placeholder="e.g., Belt, Bearing"
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
              <Button type="submit" className="w-full">Create Ticket</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">OEE Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{oee.availability}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Total Downtime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oee.totalDowntime} min</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Breakdowns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oee.breakdownCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Preventive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{oee.preventiveCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Tickets</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <Badge variant={ticket.ticket_type === "breakdown" ? "destructive" : "default"}>
                      {ticket.ticket_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.machine_name}</TableCell>
                  <TableCell className="max-w-xs truncate">{ticket.description}</TableCell>
                  <TableCell>{ticket.downtime_minutes} min</TableCell>
                  <TableCell>₹{ticket.cost}</TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>
                    {ticket.status !== "closed" && (
                      <Select
                        value={ticket.status}
                        onValueChange={(value) => updateStatus(ticket.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PackageSearch, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TraceabilityRecord {
  batch_number: string;
  material_name: string;
  purchase_date: string;
  usage_date: string;
  production_lot: string;
  production_date: string;
  sale_id: string;
  customer_name: string;
  sale_date: string;
}

export default function TraceabilityModule() {
  const [searchQuery, setSearchQuery] = useState("");
  const [traceData, setTraceData] = useState<TraceabilityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Please enter a batch number or production lot", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Search material purchases
      const { data: purchases, error: purchaseError } = await supabase
        .from("material_purchases")
        .select("batch_number, date, material_id") as any;

      if (purchaseError) throw purchaseError;

      // Search production
      const { data: production, error: productionError } = await supabase
        .from("bricks_production")
        .select("production_lot, date") as any;

      if (productionError) throw productionError;

      // Search sales
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select("id, production_lot, customer_name, date") as any;

      if (salesError) throw salesError;

      // Combine results
      const records: TraceabilityRecord[] = [];
      
      if (purchases && purchases.length > 0) {
        purchases.forEach((p: any) => {
          records.push({
            batch_number: p.batch_number || 'N/A',
            material_name: 'Material',
            purchase_date: p.date,
            usage_date: 'N/A',
            production_lot: 'N/A',
            production_date: 'N/A',
            sale_id: 'N/A',
            customer_name: 'N/A',
            sale_date: 'N/A'
          });
        });
      }

      if (production && production.length > 0) {
        production.forEach((p: any) => {
          records.push({
            batch_number: 'N/A',
            material_name: 'N/A',
            purchase_date: 'N/A',
            usage_date: 'N/A',
            production_lot: p.production_lot || 'N/A',
            production_date: p.date,
            sale_id: 'N/A',
            customer_name: 'N/A',
            sale_date: 'N/A'
          });
        });
      }

      if (sales && sales.length > 0) {
        sales.forEach((s: any) => {
          records.push({
            batch_number: 'N/A',
            material_name: 'N/A',
            purchase_date: 'N/A',
            usage_date: 'N/A',
            production_lot: s.production_lot || 'N/A',
            production_date: 'N/A',
            sale_id: s.id,
            customer_name: s.customer_name,
            sale_date: s.date
          });
        });
      }

      setTraceData(records);

      if (records.length === 0) {
        toast({ title: "No traceability records found", description: "Try a different batch or lot number" });
      }
    } catch (error: any) {
      console.error("Error searching traceability:", error);
      toast({ title: "Error searching records", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <PackageSearch className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Material Traceability</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Material Genealogy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Batch Number or Production Lot</Label>
              <Input
                placeholder="Enter batch number or production lot ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {traceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Traceability Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {traceData.map((record, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4">
                  <div className="flex items-center gap-4 flex-wrap">
                    {record.batch_number !== 'N/A' && (
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-sm text-muted-foreground">Material Purchase</div>
                        <div className="font-semibold">{record.material_name}</div>
                        <div className="text-sm">Batch: {record.batch_number}</div>
                        <div className="text-sm text-muted-foreground">{new Date(record.purchase_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    
                    {record.batch_number !== 'N/A' && record.production_lot !== 'N/A' && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    
                    {record.production_lot !== 'N/A' && (
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-sm text-muted-foreground">Production</div>
                        <div className="font-semibold">Lot: {record.production_lot}</div>
                        <div className="text-sm text-muted-foreground">{new Date(record.production_date).toLocaleDateString()}</div>
                      </div>
                    )}
                    
                    {record.production_lot !== 'N/A' && record.customer_name !== 'N/A' && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    
                    {record.customer_name !== 'N/A' && (
                      <div className="flex-1 min-w-[200px]">
                        <div className="text-sm text-muted-foreground">Sale</div>
                        <div className="font-semibold">{record.customer_name}</div>
                        <div className="text-sm">Sale ID: {record.sale_id}</div>
                        <div className="text-sm text-muted-foreground">{new Date(record.sale_date).toLocaleDateString()}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {traceData.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <PackageSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Enter a batch number or production lot to trace material genealogy</p>
              <p className="text-sm mt-2">Track materials from purchase → usage → production → sales</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

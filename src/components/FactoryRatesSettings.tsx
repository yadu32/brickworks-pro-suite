import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";

interface FactoryRate {
  id: string;
  rate_type: string;
  rate_amount: number;
  effective_date: string;
  is_active: boolean;
}

export const FactoryRatesSettings = () => {
  const [rates, setRates] = useState<FactoryRate[]>([]);
  const [productionRate, setProductionRate] = useState<number>(15);
  const [loadingRate, setLoadingRate] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    const { data, error } = await supabase
      .from("factory_rates")
      .select("*")
      .eq("is_active", true)
      .order("effective_date", { ascending: false });

    if (error) {
      toast({
        title: "Error loading rates",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      setRates(data);
      const prodRate = data.find((r) => r.rate_type === "production_per_punch");
      const loadRate = data.find((r) => r.rate_type === "loading_per_brick");
      if (prodRate) setProductionRate(prodRate.rate_amount);
      if (loadRate) setLoadingRate(loadRate.rate_amount);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Deactivate old rates
      await supabase
        .from("factory_rates")
        .update({ is_active: false })
        .eq("is_active", true);

      // Insert new rates
      const { error } = await supabase.from("factory_rates").insert([
        {
          rate_type: "production_per_punch",
          rate_amount: productionRate,
          brick_type_id: null,
          effective_date: new Date().toISOString().split("T")[0],
          is_active: true,
        },
        {
          rate_type: "loading_per_brick",
          rate_amount: loadingRate,
          brick_type_id: null,
          effective_date: new Date().toISOString().split("T")[0],
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Rates updated successfully",
        description: `Production: ₹${productionRate}/punch, Loading: ₹${loadingRate}/brick`,
      });

      loadRates();
    } catch (error: any) {
      toast({
        title: "Error saving rates",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Factory Rates Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Piece-Rate Wages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="productionRate">Production Rate (per punch)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm">₹</span>
              <Input
                id="productionRate"
                type="number"
                step="0.01"
                value={productionRate}
                onChange={(e) => setProductionRate(parseFloat(e.target.value))}
                className="max-w-xs"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Amount paid per punch to production workers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loadingRate">Loading Rate (per brick)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm">₹</span>
              <Input
                id="loadingRate"
                type="number"
                step="0.01"
                value={loadingRate}
                onChange={(e) => setLoadingRate(parseFloat(e.target.value))}
                className="max-w-xs"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Amount paid per brick to loading workers
            </p>
          </div>

          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Rates"}
          </Button>
        </CardContent>
      </Card>

      {rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rate History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className="flex justify-between items-center p-2 border rounded"
                >
                  <span className="text-sm">
                    {rate.rate_type === "production_per_punch"
                      ? "Production Rate"
                      : "Loading Rate"}
                  </span>
                  <span className="text-sm">₹{rate.rate_amount}</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(rate.effective_date).toLocaleDateString()}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      rate.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {rate.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

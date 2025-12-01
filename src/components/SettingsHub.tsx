import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Package, 
  Wrench, 
  DollarSign, 
  Plus, 
  Pencil, 
  Trash2,
  Factory
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SettingsSection = 'brick-types' | 'raw-materials' | 'wages-rates' | 'factory-info';

interface BrickType {
  id: string;
  type_name: string;
  standard_bricks_per_punch: number;
  unit: string;
  is_active: boolean;
}

interface Material {
  id: string;
  material_name: string;
  unit: string;
  current_stock_qty: number;
  average_cost_per_unit: number;
}

interface FactoryRate {
  id: string;
  rate_type: string;
  rate_amount: number;
  effective_date: string;
  is_active: boolean;
}

export const SettingsHub = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('brick-types');
  const { toast } = useToast();

  // Brick Types State
  const [brickTypes, setBrickTypes] = useState<BrickType[]>([]);
  const [brickTypeDialog, setBrickTypeDialog] = useState(false);
  const [editingBrickType, setEditingBrickType] = useState<BrickType | null>(null);
  const [brickTypeName, setBrickTypeName] = useState('');
  const [brickTypePerPunch, setBrickTypePerPunch] = useState<number>(4);
  const [brickTypeUnit, setBrickTypeUnit] = useState('pieces');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'brick' | 'material'; id: string } | null>(null);

  // Materials State
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialDialog, setMaterialDialog] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialName, setMaterialName] = useState('');
  const [materialUnit, setMaterialUnit] = useState('');

  // Rates State
  const [rates, setRates] = useState<FactoryRate[]>([]);
  const [productionRate, setProductionRate] = useState<number>(15);
  const [loadingRate, setLoadingRate] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);

  // Factory Info State
  const [factoryName, setFactoryName] = useState('BrickWorks Factory');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([loadBrickTypes(), loadMaterials(), loadRates()]);
  };

  const loadBrickTypes = async () => {
    const { data, error } = await supabase
      .from("brick_types")
      .select("*")
      .order("type_name");

    if (error) {
      toast({ title: "Error loading brick types", description: error.message, variant: "destructive" });
      return;
    }
    setBrickTypes(data || []);
  };

  const loadMaterials = async () => {
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("material_name");

    if (error) {
      toast({ title: "Error loading materials", description: error.message, variant: "destructive" });
      return;
    }
    setMaterials(data || []);
  };

  const loadRates = async () => {
    const { data, error } = await supabase
      .from("factory_rates")
      .select("*")
      .eq("is_active", true)
      .order("effective_date", { ascending: false });

    if (error) {
      toast({ title: "Error loading rates", description: error.message, variant: "destructive" });
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

  // Brick Type CRUD
  const openBrickTypeDialog = (brickType?: BrickType) => {
    if (brickType) {
      setEditingBrickType(brickType);
      setBrickTypeName(brickType.type_name);
      setBrickTypePerPunch(brickType.standard_bricks_per_punch);
      setBrickTypeUnit(brickType.unit);
    } else {
      setEditingBrickType(null);
      setBrickTypeName('');
      setBrickTypePerPunch(4);
      setBrickTypeUnit('pieces');
    }
    setBrickTypeDialog(true);
  };

  const saveBrickType = async () => {
    if (!brickTypeName.trim()) {
      toast({ title: "Please enter brick type name", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (editingBrickType) {
        const { error } = await supabase
          .from("brick_types")
          .update({
            type_name: brickTypeName,
            standard_bricks_per_punch: brickTypePerPunch,
            unit: brickTypeUnit,
          })
          .eq("id", editingBrickType.id);

        if (error) throw error;
        toast({ title: "Brick type updated successfully" });
      } else {
        const { error } = await supabase.from("brick_types").insert({
          type_name: brickTypeName,
          standard_bricks_per_punch: brickTypePerPunch,
          unit: brickTypeUnit,
          is_active: true,
        });

        if (error) throw error;
        toast({ title: "Brick type added successfully" });
      }
      setBrickTypeDialog(false);
      loadBrickTypes();
    } catch (error: any) {
      toast({ title: "Error saving brick type", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBrickType = async (id: string) => {
    try {
      const { error } = await supabase.from("brick_types").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Brick type deleted" });
      loadBrickTypes();
    } catch (error: any) {
      toast({ title: "Error deleting brick type", description: error.message, variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  // Material CRUD
  const openMaterialDialog = (material?: Material) => {
    if (material) {
      setEditingMaterial(material);
      setMaterialName(material.material_name);
      setMaterialUnit(material.unit);
    } else {
      setEditingMaterial(null);
      setMaterialName('');
      setMaterialUnit('');
    }
    setMaterialDialog(true);
  };

  const saveMaterial = async () => {
    if (!materialName.trim() || !materialUnit.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (editingMaterial) {
        const { error } = await supabase
          .from("materials")
          .update({
            material_name: materialName,
            unit: materialUnit,
          })
          .eq("id", editingMaterial.id);

        if (error) throw error;
        toast({ title: "Material updated successfully" });
      } else {
        const { error } = await supabase.from("materials").insert({
          material_name: materialName,
          unit: materialUnit,
          current_stock_qty: 0,
          average_cost_per_unit: 0,
        });

        if (error) throw error;
        toast({ title: "Material added successfully" });
      }
      setMaterialDialog(false);
      loadMaterials();
    } catch (error: any) {
      toast({ title: "Error saving material", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { error } = await supabase.from("materials").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Material deleted" });
      loadMaterials();
    } catch (error: any) {
      toast({ title: "Error deleting material", description: error.message, variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  // Save Rates
  const saveRates = async () => {
    setIsLoading(true);
    try {
      await supabase
        .from("factory_rates")
        .update({ is_active: false })
        .eq("is_active", true);

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
      toast({ title: "Rates updated successfully" });
      loadRates();
    } catch (error: any) {
      toast({ title: "Error saving rates", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { id: 'factory-info' as const, label: 'Factory Info', icon: Factory },
    { id: 'brick-types' as const, label: 'Brick Types', icon: Package },
    { id: 'raw-materials' as const, label: 'Raw Materials', icon: Wrench },
    { id: 'wages-rates' as const, label: 'Wages & Rates', icon: DollarSign },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Settings Hub ({factoryName})</h1>
      </div>

      {/* Navigation Menu */}
      <Card className="bg-card">
        <CardContent className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Factory Info Section */}
      {activeSection === 'factory-info' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Factory Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="factoryName">Factory Name</Label>
              <Input
                id="factoryName"
                value={factoryName}
                onChange={(e) => setFactoryName(e.target.value)}
                placeholder="Enter factory name"
              />
            </div>
            <Button onClick={() => toast({ title: "Factory info saved" })}>
              Save Factory Info
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Brick Types Section */}
      {activeSection === 'brick-types' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Manage Brick Types
            </CardTitle>
            <Button onClick={() => openBrickTypeDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add New Brick Type
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {brickTypes.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No brick types defined. Add your first brick type.</p>
            ) : (
              brickTypes.map((bt) => (
                <div key={bt.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{bt.type_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {bt.standard_bricks_per_punch} {bt.unit} per punch
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openBrickTypeDialog(bt)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleteConfirm({ type: 'brick', id: bt.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Raw Materials Section */}
      {activeSection === 'raw-materials' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Manage Raw Materials
            </CardTitle>
            <Button onClick={() => openMaterialDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add New Material
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {materials.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No materials defined. Add your first material.</p>
            ) : (
              materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{m.material_name}</p>
                    <p className="text-sm text-muted-foreground">Unit: {m.unit}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openMaterialDialog(m)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleteConfirm({ type: 'material', id: m.id })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Wages & Rates Section */}
      {activeSection === 'wages-rates' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Piece-Rate Wages
            </CardTitle>
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
                  onChange={(e) => setProductionRate(parseFloat(e.target.value) || 0)}
                  className="max-w-xs"
                />
              </div>
              <p className="text-sm text-muted-foreground">Amount paid per punch to production workers</p>
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
                  onChange={(e) => setLoadingRate(parseFloat(e.target.value) || 0)}
                  className="max-w-xs"
                />
              </div>
              <p className="text-sm text-muted-foreground">Amount paid per brick to loading workers</p>
            </div>

            <Button onClick={saveRates} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Rates"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Brick Type Dialog */}
      <Dialog open={brickTypeDialog} onOpenChange={setBrickTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBrickType ? 'Edit Brick Type' : 'Add New Brick Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="btName">Brick Type Name</Label>
              <Input
                id="btName"
                value={brickTypeName}
                onChange={(e) => setBrickTypeName(e.target.value)}
                placeholder="e.g., 4-inch Hollow Brick"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="btPerPunch">Bricks Per Punch</Label>
              <Input
                id="btPerPunch"
                type="number"
                value={brickTypePerPunch}
                onChange={(e) => setBrickTypePerPunch(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="btUnit">Unit</Label>
              <Input
                id="btUnit"
                value={brickTypeUnit}
                onChange={(e) => setBrickTypeUnit(e.target.value)}
                placeholder="e.g., pieces"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrickTypeDialog(false)}>Cancel</Button>
            <Button onClick={saveBrickType} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Dialog */}
      <Dialog open={materialDialog} onOpenChange={setMaterialDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Edit Material' : 'Add New Material'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="matName">Material Name</Label>
              <Input
                id="matName"
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="e.g., Cement"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="matUnit">Unit</Label>
              <Input
                id="matUnit"
                value={materialUnit}
                onChange={(e) => setMaterialUnit(e.target.value)}
                placeholder="e.g., bags, tons, liters"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialog(false)}>Cancel</Button>
            <Button onClick={saveMaterial} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {deleteConfirm?.type === 'brick' ? 'brick type' : 'material'}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === 'brick') {
                  deleteBrickType(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'material') {
                  deleteMaterial(deleteConfirm.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

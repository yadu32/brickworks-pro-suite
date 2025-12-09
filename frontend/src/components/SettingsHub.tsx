import { useState, useEffect } from "react";
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
  Factory,
  LogOut
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

interface ProductDefinition {
  id: string;
  name: string;
  size_description: string | null;
  items_per_punch: number | null;
  unit: string;
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

interface FactoryInfo {
  id: string;
  name: string;
  location: string | null;
}

export const SettingsHub = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('factory-info');
  const { toast } = useToast();

  // Factory State
  const [factory, setFactory] = useState<FactoryInfo | null>(null);
  const [factoryName, setFactoryName] = useState('');
  const [factoryLocation, setFactoryLocation] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Product Definitions State (instead of brick_types)
  const [products, setProducts] = useState<ProductDefinition[]>([]);
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDefinition | null>(null);
  const [productName, setProductName] = useState('');
  const [productSize, setProductSize] = useState('');
  const [productPerPunch, setProductPerPunch] = useState<number>(4);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'product' | 'material'; id: string } | null>(null);

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

  useEffect(() => {
    loadFactory();
  }, []);

  useEffect(() => {
    if (factory) {
      loadAllData();
    }
  }, [factory]);

  const loadFactory = async () => {
    try {
      const { factoryApi } = await import('@/api/factory');
      const factories = await factoryApi.getAll();
      
      if (!factories || factories.length === 0) {
        toast({ title: "No factory found", description: "Please complete onboarding first", variant: "destructive" });
        return;
      }

      const factoryData = factories[0];
      setFactory(factoryData);
      setFactoryName(factoryData.name);
      setFactoryLocation(factoryData.location || '');
    } catch (error: any) {
      toast({ title: "Error loading factory", description: error.message || "Failed to load", variant: "destructive" });
    }
  };

  const loadAllData = async () => {
    if (!factory) return;
    await Promise.all([loadProducts(), loadMaterials(), loadRates()]);
  };

  const loadProducts = async () => {
    if (!factory) return;
    
    try {
      const { productApi } = await import('@/api/product');
      const data = await productApi.getByFactory(factory.id);
      setProducts(data || []);
    } catch (error: any) {
      toast({ title: "Error loading products", description: error.message || "Failed to load", variant: "destructive" });
    }
  };

  const loadMaterials = async () => {
    if (!factory) return;
    
    try {
      const { materialApi } = await import('@/api/material');
      const data = await materialApi.getByFactory(factory.id);
      setMaterials(data || []);
    } catch (error: any) {
      toast({ title: "Error loading materials", description: error.message || "Failed to load", variant: "destructive" });
    }
  };

  const loadRates = async () => {
    if (!factory) return;
    
    try {
      const { expenseApi } = await import('@/api/expense');
      const data = await expenseApi.getRates(factory.id);
      
      if (data) {
        setRates(data);
        const prodRate = data.find((r: any) => r.rate_type === "production_per_punch");
        const loadRate = data.find((r: any) => r.rate_type === "loading_per_brick");
        if (prodRate) setProductionRate(prodRate.rate_amount);
        if (loadRate) setLoadingRate(loadRate.rate_amount);
      }
    } catch (error: any) {
      toast({ title: "Error loading rates", description: error.message || "Failed to load", variant: "destructive" });
    }
  };

  // Factory Update
  const saveFactory = async () => {
    if (!factory) return;
    
    setIsLoading(true);
    try {
      const { factoryApi } = await import('@/api/factory');
      await factoryApi.update(factory.id, { 
        name: factoryName, 
        location: factoryLocation || undefined 
      });
      
      toast({ title: "Factory info saved" });
      await loadFactory();
    } catch (error: any) {
      toast({ title: "Error saving factory", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Product CRUD
  const openProductDialog = (product?: ProductDefinition) => {
    if (product) {
      setEditingProduct(product);
      setProductName(product.name);
      setProductSize(product.size_description || '');
      setProductPerPunch(product.items_per_punch || 4);
    } else {
      setEditingProduct(null);
      setProductName('');
      setProductSize('');
      setProductPerPunch(4);
    }
    setProductDialog(true);
  };

  const saveProduct = async () => {
    if (!factory || !productName.trim()) {
      toast({ title: "Please enter product name", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { productApi } = await import('@/api/product');
      
      if (editingProduct) {
        await productApi.update(editingProduct.id, {
          name: productName,
          size_description: productSize || undefined,
          items_per_punch: productPerPunch,
        });
        toast({ title: "Product updated successfully" });
      } else {
        await productApi.create({
          factory_id: factory.id,
          name: productName,
          size_description: productSize || undefined,
          items_per_punch: productPerPunch,
          unit: 'Pieces',
        });
        toast({ title: "Product added successfully" });
      }
      setProductDialog(false);
      await loadProducts();
    } catch (error: any) {
      toast({ title: "Error saving product", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { productApi } = await import('@/api/product');
      await productApi.delete(id);
      toast({ title: "Product deleted" });
      await loadProducts();
    } catch (error: any) {
      toast({ title: "Error deleting product", description: error.message || "Failed to delete", variant: "destructive" });
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
    if (!factory || !materialName.trim() || !materialUnit.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { materialApi } = await import('@/api/material');
      
      if (editingMaterial) {
        await materialApi.update(editingMaterial.id, {
          material_name: materialName,
          unit: materialUnit,
        });
        toast({ title: "Material updated successfully" });
      } else {
        await materialApi.create({
          factory_id: factory.id,
          material_name: materialName,
          unit: materialUnit,
          current_stock_qty: 0,
          average_cost_per_unit: 0,
        });
        toast({ title: "Material added successfully" });
      }
      setMaterialDialog(false);
      await loadMaterials();
    } catch (error: any) {
      toast({ title: "Error saving material", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMaterial = async (id: string) => {
    try {
      const { materialApi } = await import('@/api/material');
      await materialApi.delete(id);
      toast({ title: "Material deleted" });
      await loadMaterials();
    } catch (error: any) {
      toast({ title: "Error deleting material", description: error.message || "Failed to delete", variant: "destructive" });
    }
    setDeleteConfirm(null);
  };

  // Save Rates
  const saveRates = async () => {
    if (!factory) return;
    
    setIsLoading(true);
    try {
      const { expenseApi } = await import('@/api/expense');
      
      // Create new rates (backend will handle deactivating old ones if needed)
      await expenseApi.createRate({
        factory_id: factory.id,
        rate_type: "production_per_punch",
        rate_amount: productionRate,
        is_active: true,
      });

      await expenseApi.createRate({
        factory_id: factory.id,
        rate_type: "loading_per_brick",
        rate_amount: loadingRate,
        is_active: true,
      });

      toast({ title: "Rates updated successfully" });
      await loadRates();
    } catch (error: any) {
      toast({ title: "Error saving rates", description: error.message || "Failed to save", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const menuItems = [
    { id: 'factory-info' as const, label: 'Factory Info', icon: Factory },
    { id: 'brick-types' as const, label: 'Brick Types', icon: Package },
    { id: 'raw-materials' as const, label: 'Raw Materials', icon: Wrench },
    { id: 'wages-rates' as const, label: 'Wages & Rates', icon: DollarSign },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
        <Button variant="outline" onClick={handleLogout} className="text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
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
            <div className="space-y-2">
              <Label htmlFor="factoryLocation">Location</Label>
              <Input
                id="factoryLocation"
                value={factoryLocation}
                onChange={(e) => setFactoryLocation(e.target.value)}
                placeholder="Enter location"
              />
            </div>
            <Button onClick={saveFactory} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Factory Info"}
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
            <Button onClick={() => openProductDialog()} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {products.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No brick types defined. Add your first brick type.</p>
            ) : (
              products.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.size_description && `${p.size_description} • `}{p.items_per_punch} per punch
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openProductDialog(p)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => setDeleteConfirm({ type: 'product', id: p.id })}
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
              Add New
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

      {/* Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Brick Type' : 'Add New Brick Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pName">Brick Name</Label>
              <Input
                id="pName"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Solid Block 4 Inch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pSize">Size Description</Label>
              <Input
                id="pSize"
                value={productSize}
                onChange={(e) => setProductSize(e.target.value)}
                placeholder="e.g., 4 inch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pPerPunch">Bricks Per Punch</Label>
              <Input
                id="pPerPunch"
                type="number"
                value={productPerPunch}
                onChange={(e) => setProductPerPunch(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialog(false)}>Cancel</Button>
            <Button onClick={saveProduct} disabled={isLoading}>
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
              Are you sure you want to delete this {deleteConfirm?.type === 'product' ? 'brick type' : 'material'}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === 'product') {
                  deleteProduct(deleteConfirm.id);
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

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';

interface BrickTypeInput {
  name: string;
  size: string;
  bricksPerPunch: number;
}

interface MaterialInput {
  name: string;
  unit: string;
}

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

const Onboarding = ({ userId, onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Step 1: Factory Details
  const [factoryName, setFactoryName] = useState('');
  const [location, setLocation] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Step 2: Brick Types
  const [brickTypes, setBrickTypes] = useState<BrickTypeInput[]>([
    { name: 'Solid Block 4 Inch', size: '4 inch', bricksPerPunch: 4 },
    { name: 'Solid Block 6 Inch', size: '6 inch', bricksPerPunch: 5 },
  ]);

  // Step 3: Raw Materials
  const [materials, setMaterials] = useState<MaterialInput[]>([
    { name: 'Cement', unit: 'Bags' },
    { name: 'Dust', unit: 'Tons' },
    { name: 'M-Sand', unit: 'Tons' },
  ]);

  const addBrickType = () => {
    setBrickTypes([...brickTypes, { name: '', size: '', bricksPerPunch: 4 }]);
  };

  const removeBrickType = (index: number) => {
    if (brickTypes.length > 1) {
      setBrickTypes(brickTypes.filter((_, i) => i !== index));
    }
  };

  const updateBrickType = (index: number, field: keyof BrickTypeInput, value: string | number) => {
    const updated = [...brickTypes];
    updated[index] = { ...updated[index], [field]: value };
    setBrickTypes(updated);
  };

  const addMaterial = () => {
    setMaterials([...materials, { name: '', unit: '' }]);
  };

  const removeMaterial = (index: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter((_, i) => i !== index));
    }
  };

  const updateMaterial = (index: number, field: keyof MaterialInput, value: string) => {
    const updated = [...materials];
    updated[index] = { ...updated[index], [field]: value };
    setMaterials(updated);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!factoryName.trim()) {
        toast({ title: "Please enter factory name", variant: "destructive" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const valid = brickTypes.every(bt => bt.name.trim() && bt.bricksPerPunch > 0);
      if (!valid) {
        toast({ title: "Please fill all brick type details", variant: "destructive" });
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleFinish = async () => {
    const validMaterials = materials.filter(m => m.name.trim() && m.unit.trim());
    if (validMaterials.length === 0) {
      toast({ title: "Please add at least one material", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Starting onboarding process...');
      
      // Import APIs
      const { factoryApi } = await import('@/api/factory');
      const { productApi } = await import('@/api/product');
      const { materialApi } = await import('@/api/material');
      const { expenseApi } = await import('@/api/expense');

      // STEP 1: Create factory FIRST (CRITICAL - must complete before anything else)
      console.log('Step 1: Creating factory...', { name: factoryName, location });
      let factory;
      try {
        factory = await factoryApi.create({
          name: factoryName,
          location: location || undefined,
        });
        console.log('Factory created successfully:', factory);
      } catch (error: any) {
        console.error('Factory creation failed:', error);
        throw new Error(`Failed to create factory: ${error.response?.data?.detail || error.message}`);
      }

      if (!factory || !factory.id) {
        throw new Error('Factory was created but no ID was returned');
      }

      const factoryId = factory.id;
      console.log('Factory ID:', factoryId);

      // STEP 2: Create product definitions (brick types) - SEQUENTIAL
      console.log('Step 2: Creating product definitions...');
      const validBrickTypes = brickTypes.filter(bt => bt.name.trim());
      for (let i = 0; i < validBrickTypes.length; i++) {
        const bt = validBrickTypes[i];
        try {
          console.log(`Creating product ${i + 1}/${validBrickTypes.length}:`, bt.name);
          await productApi.create({
            factory_id: factoryId,
            name: bt.name,
            size_description: bt.size || undefined,
            items_per_punch: bt.bricksPerPunch,
            unit: 'Pieces',
          });
        } catch (error: any) {
          console.error(`Failed to create product "${bt.name}":`, error);
          throw new Error(`Failed to create brick type "${bt.name}": ${error.response?.data?.detail || error.message}`);
        }
      }
      console.log('Products created successfully');

      // STEP 3: Create materials inventory - SEQUENTIAL
      console.log('Step 3: Creating materials...');
      for (let i = 0; i < validMaterials.length; i++) {
        const m = validMaterials[i];
        try {
          console.log(`Creating material ${i + 1}/${validMaterials.length}:`, m.name);
          await materialApi.create({
            factory_id: factoryId,
            material_name: m.name,
            unit: m.unit,
            current_stock_qty: 0,
            average_cost_per_unit: 0,
          });
        } catch (error: any) {
          console.error(`Failed to create material "${m.name}":`, error);
          throw new Error(`Failed to create material "${m.name}": ${error.response?.data?.detail || error.message}`);
        }
      }
      console.log('Materials created successfully');

      // STEP 4: Create default factory rates
      console.log('Step 4: Creating factory rates...');
      try {
        await expenseApi.createRate({
          factory_id: factoryId,
          rate_type: 'production_per_punch',
          rate_amount: 15,
          is_active: true,
        });

        await expenseApi.createRate({
          factory_id: factoryId,
          rate_type: 'loading_per_brick',
          rate_amount: 2,
          is_active: true,
        });
        console.log('Factory rates created successfully');
      } catch (error: any) {
        console.error('Failed to create factory rates:', error);
        // Don't fail the entire onboarding for rates - they can be set later
        console.warn('Rates creation failed but continuing...');
      }

      console.log('Onboarding completed successfully!');
      toast({ title: "Setup complete!", description: "Your factory is ready to use." });
      onComplete();
    } catch (error: any) {
      console.error('=== ONBOARDING ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response detail:', error.response?.data?.detail);
      console.error('========================');
      
      let message = 'Setup failed';
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network')) {
        message = 'Network Error: Cannot connect to server. Please check your internet connection and try again.';
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error.message) {
        message = error.message;
      }
      
      toast({ 
        title: "Setup failed", 
        description: message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardContent className="pt-6">
          {/* Step 1: Factory Details */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Step 1: Factory Details</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="factoryName">Factory Name</Label>
                  <Input
                    id="factoryName"
                    placeholder="My Brick Factory"
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    className="bg-muted"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Village / Location</Label>
                  <Input
                    id="location"
                    placeholder="Village Name"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleNext} className="bg-primary">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Brick Types */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Step 2: Brick Types</h2>
                <p className="text-muted-foreground">What bricks do you manufacture?</p>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {brickTypes.map((bt, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">Brick Type #{index + 1}</span>
                      {brickTypes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBrickType(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <Input
                      placeholder="Brick Name (e.g., Solid Block 4 Inch)"
                      value={bt.name}
                      onChange={(e) => updateBrickType(index, 'name', e.target.value)}
                      className="bg-muted"
                    />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Size (e.g., 4 inch)"
                        value={bt.size}
                        onChange={(e) => updateBrickType(index, 'size', e.target.value)}
                        className="bg-muted"
                      />
                      <Input
                        type="number"
                        placeholder="Per Punch"
                        value={bt.bricksPerPunch}
                        onChange={(e) => updateBrickType(index, 'bricksPerPunch', parseInt(e.target.value) || 0)}
                        className="bg-muted"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addBrickType}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Brick Type
              </Button>
              
              <div className="flex justify-between">
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext} className="bg-primary">
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Raw Materials */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Step 3: Raw Materials</h2>
                <p className="text-muted-foreground">What raw materials do you buy?</p>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {materials.map((m, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Material Name"
                      value={m.name}
                      onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                      className="bg-muted flex-1"
                    />
                    <Input
                      placeholder="Unit"
                      value={m.unit}
                      onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                      className="bg-muted w-24"
                    />
                    {materials.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMaterial(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={addMaterial}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
              
              <div className="flex justify-between">
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleFinish} disabled={loading}>
                  {loading ? 'Setting up...' : 'Finish Setup'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;

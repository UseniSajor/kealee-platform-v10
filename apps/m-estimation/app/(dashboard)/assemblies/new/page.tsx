'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface NewAssemblyItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

const itemTypes = [
  { value: 'MATERIAL_ITEM', label: 'Material' },
  { value: 'LABOR_ITEM', label: 'Labor' },
  { value: 'EQUIPMENT_ITEM', label: 'Equipment' },
  { value: 'SUBCONTRACTOR_ITEM', label: 'Subcontractor' },
  { value: 'OTHER_ITEM', label: 'Other' },
];

const categoryOptions = [
  'SITEWORK', 'FOUNDATIONS', 'CONCRETE_FLATWORK', 'FRAMING', 'ROOFING_ASSEMBLY',
  'EXTERIOR_FINISHES', 'INTERIOR_FINISHES', 'DRYWALL', 'PAINTING', 'FLOORING',
  'TILE', 'CABINETRY', 'COUNTERTOPS', 'DOORS_HARDWARE', 'WINDOWS',
  'PLUMBING_ROUGH', 'PLUMBING_FINISH', 'ELECTRICAL_ROUGH', 'ELECTRICAL_FINISH',
  'HVAC_ROUGH', 'HVAC_FINISH', 'INSULATION_ASSEMBLY', 'DEMOLITION_ASSEMBLY',
  'CLEANUP', 'PERMITS_FEES', 'GENERAL_CONDITIONS_ASSEMBLY', 'OTHER_ASSEMBLY',
];

const complexityOptions = ['SIMPLE', 'STANDARD', 'COMPLEX', 'CUSTOM_COMPLEXITY'];

let nextItemId = 1;

export default function NewAssemblyPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    code: '',
    csiCode: '',
    category: 'OTHER_ASSEMBLY',
    unit: 'EA',
    complexity: 'STANDARD',
    description: '',
  });
  const [items, setItems] = useState<NewAssemblyItem[]>([]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${nextItemId++}`,
        type: 'MATERIAL_ITEM',
        description: '',
        quantity: 1,
        unit: 'EA',
        unitCost: 0,
      },
    ]);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const totalCost = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  const handleSave = async () => {
    if (!form.name || !form.code) return;

    setIsSaving(true);
    try {
      const response = await apiClient.createAssembly({
        ...form,
        unitCost: totalCost,
        laborHours: items
          .filter((i) => i.type === 'LABOR_ITEM')
          .reduce((sum, i) => sum + i.quantity, 0),
        items: items.map((item) => ({
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        })),
      });

      if (response.success) {
        router.push('/assemblies');
      }
    } catch {
      // Error handled by API client
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/assemblies">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Assembly</h1>
            <p className="text-muted-foreground mt-1">Build a reusable cost assembly template</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving || !form.name || !form.code}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Assembly
        </Button>
      </div>

      {/* Assembly Details */}
      <Card>
        <CardHeader>
          <CardTitle>Assembly Details</CardTitle>
          <CardDescription>Basic information about this assembly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Assembly Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., 8-inch CMU Wall"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Assembly Code *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g., CMU-WALL-8IN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="csiCode">CSI Code</Label>
              <Input
                id="csiCode"
                value={form.csiCode}
                onChange={(e) => setForm({ ...form, csiCode: e.target.value })}
                placeholder="e.g., 04 22 00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="e.g., SF, LF, EA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complexity">Complexity</Label>
              <select
                id="complexity"
                value={form.complexity}
                onChange={(e) => setForm({ ...form, complexity: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {complexityOptions.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe this assembly and when to use it..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assembly Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assembly Items</CardTitle>
              <CardDescription>Add materials, labor, and equipment to this assembly</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-3 px-3 text-sm font-medium text-muted-foreground">
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-2">Unit Cost</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1"></div>
              </div>
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2">
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(item.id, 'type', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    >
                      {itemTypes.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-1">
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      value={item.unitCost}
                      onChange={(e) => updateItem(item.id, 'unitCost', parseFloat(e.target.value) || 0)}
                      className="h-9"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2 text-sm font-medium">
                    {formatCurrency(item.quantity * item.unitCost)}
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-9 w-9 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-3">No items added yet</p>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Assembly Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Per {form.unit}</p>
              <p className="text-sm text-muted-foreground">{items.length} items</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

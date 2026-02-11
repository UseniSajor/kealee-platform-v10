'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Copy,
  Trash2,
  Package,
  Loader2,
  DollarSign,
  Clock,
  Layers,
  Wrench,
  Zap,
  Truck,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface AssemblyItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface AssemblyDetail {
  id: string;
  code: string;
  name: string;
  csiCode?: string;
  category: string;
  unit: string;
  unitCost: number;
  laborHours?: number;
  complexity?: string;
  description?: string;
  items: AssemblyItem[];
}

const itemTypeIcons: Record<string, any> = {
  MATERIAL_ITEM: Package,
  LABOR_ITEM: Wrench,
  EQUIPMENT_ITEM: Truck,
  SUBCONTRACTOR_ITEM: Zap,
  OTHER_ITEM: Layers,
};

const itemTypeLabels: Record<string, string> = {
  MATERIAL_ITEM: 'Material',
  LABOR_ITEM: 'Labor',
  EQUIPMENT_ITEM: 'Equipment',
  SUBCONTRACTOR_ITEM: 'Subcontractor',
  OTHER_ITEM: 'Other',
};

const itemTypeColors: Record<string, string> = {
  MATERIAL_ITEM: 'bg-violet-100 text-violet-700',
  LABOR_ITEM: 'bg-cyan-100 text-cyan-700',
  EQUIPMENT_ITEM: 'bg-amber-100 text-amber-700',
  SUBCONTRACTOR_ITEM: 'bg-green-100 text-green-700',
  OTHER_ITEM: 'bg-gray-100 text-gray-700',
};

export default function AssemblyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [assembly, setAssembly] = useState<AssemblyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssembly() {
      setIsLoading(true);
      try {
        const response = await apiClient.getAssemblyById(params.id as string);
        if (response.success && response.data) {
          setAssembly(response.data as AssemblyDetail);
        } else {
          setError(response.error || 'Failed to load assembly');
        }
      } catch {
        setError('Failed to load assembly');
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) fetchAssembly();
  }, [params.id]);

  const handleDelete = async () => {
    if (!assembly || !confirm('Are you sure you want to delete this assembly?')) return;
    const response = await apiClient.deleteAssembly(assembly.id);
    if (response.success) {
      router.push('/dashboard/assemblies');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
        <span className="text-muted-foreground">Loading assembly...</span>
      </div>
    );
  }

  if (error || !assembly) {
    return (
      <div className="text-center py-24">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">{error || 'Assembly not found'}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/assemblies">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Assemblies
          </Link>
        </Button>
      </div>
    );
  }

  const materialCost = assembly.items
    .filter((i) => i.type === 'MATERIAL_ITEM')
    .reduce((sum, i) => sum + i.totalCost, 0);
  const laborCost = assembly.items
    .filter((i) => i.type === 'LABOR_ITEM')
    .reduce((sum, i) => sum + i.totalCost, 0);
  const equipmentCost = assembly.items
    .filter((i) => i.type === 'EQUIPMENT_ITEM')
    .reduce((sum, i) => sum + i.totalCost, 0);
  const otherCost = assembly.items
    .filter((i) => !['MATERIAL_ITEM', 'LABOR_ITEM', 'EQUIPMENT_ITEM'].includes(i.type))
    .reduce((sum, i) => sum + i.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/assemblies">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{assembly.name}</h1>
            <p className="text-muted-foreground mt-1">
              {assembly.code} {assembly.csiCode ? `| CSI ${assembly.csiCode}` : ''} | {assembly.category.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto text-green-600 mb-2" />
            <p className="text-2xl font-bold">{formatCurrency(assembly.unitCost)}</p>
            <p className="text-sm text-muted-foreground">per {assembly.unit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Layers className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{assembly.items.length}</p>
            <p className="text-sm text-muted-foreground">Line Items</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto text-cyan-600 mb-2" />
            <p className="text-2xl font-bold">{assembly.laborHours || 0}h</p>
            <p className="text-sm text-muted-foreground">Labor Hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            {assembly.complexity && (
              <Badge className="text-sm">{assembly.complexity.replace('_', ' ')}</Badge>
            )}
            <p className="text-sm text-muted-foreground mt-2">Complexity</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-violet-50 rounded-lg p-4">
              <p className="text-sm text-violet-700 font-medium">Materials</p>
              <p className="text-xl font-bold text-violet-900">{formatCurrency(materialCost)}</p>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4">
              <p className="text-sm text-cyan-700 font-medium">Labor</p>
              <p className="text-xl font-bold text-cyan-900">{formatCurrency(laborCost)}</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm text-amber-700 font-medium">Equipment</p>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(equipmentCost)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 font-medium">Other</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(otherCost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assembly Items</CardTitle>
          <CardDescription>{assembly.items.length} items in this assembly</CardDescription>
        </CardHeader>
        <CardContent>
          {assembly.items.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-md text-sm font-medium text-muted-foreground">
                <div className="col-span-1">Type</div>
                <div className="col-span-4">Description</div>
                <div className="col-span-2 text-right">Quantity</div>
                <div className="col-span-1">Unit</div>
                <div className="col-span-2 text-right">Unit Cost</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {assembly.items.map((item) => {
                const Icon = itemTypeIcons[item.type] || Layers;
                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg items-center"
                  >
                    <div className="col-span-1">
                      <div className={`inline-flex items-center justify-center h-8 w-8 rounded ${itemTypeColors[item.type] || 'bg-gray-100'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="col-span-4">
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-xs text-muted-foreground">{itemTypeLabels[item.type] || item.type}</p>
                    </div>
                    <div className="col-span-2 text-right text-sm">{item.quantity}</div>
                    <div className="col-span-1 text-sm text-muted-foreground">{item.unit}</div>
                    <div className="col-span-2 text-right text-sm">{formatCurrency(item.unitCost)}</div>
                    <div className="col-span-2 text-right text-sm font-medium">{formatCurrency(item.totalCost)}</div>
                  </div>
                );
              })}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/30 rounded-lg font-medium">
                <div className="col-span-10 text-right">Assembly Total:</div>
                <div className="col-span-2 text-right">{formatCurrency(assembly.unitCost)}</div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No items in this assembly</p>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {assembly.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assembly.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

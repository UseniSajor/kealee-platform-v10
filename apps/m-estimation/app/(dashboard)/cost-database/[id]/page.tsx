'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  Search,
  Database,
  Loader2,
  Package,
  Wrench,
  Truck,
  Layers,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Info,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { formatCurrency, debounce } from '@/lib/utils';

interface CostDatabaseDetail {
  id: string;
  name: string;
  description?: string;
  region: string;
  type: string;
  version: string;
  effectiveDate: string;
  source?: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    materials: number;
    laborRates: number;
    equipmentRates: number;
    assemblies: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const categoryLabels: Record<string, string> = {
  CONCRETE: 'Concrete', MASONRY: 'Masonry', METALS: 'Metals',
  WOOD_PLASTICS_COMPOSITES: 'Wood/Plastics', THERMAL_MOISTURE: 'Thermal/Moisture',
  OPENINGS: 'Openings', FINISHES: 'Finishes', SPECIALTIES: 'Specialties',
  EQUIPMENT_MATERIAL: 'Equipment', FURNISHINGS: 'Furnishings',
  PLUMBING_MATERIAL: 'Plumbing', HVAC_MATERIAL: 'HVAC', ELECTRICAL_MATERIAL: 'Electrical',
  EARTHWORK: 'Earthwork', EXTERIOR_IMPROVEMENTS: 'Exterior', UTILITIES: 'Utilities',
  GENERAL_CONDITIONS: 'General Conditions', OTHER_MATERIAL: 'Other',
};

const tradeLabels: Record<string, string> = {
  GENERAL_LABOR: 'General Labor', CARPENTER: 'Carpenter', ELECTRICIAN: 'Electrician',
  PLUMBER: 'Plumber', HVAC_TECHNICIAN: 'HVAC Technician', PAINTER: 'Painter',
  DRYWALL_FINISHER: 'Drywall Finisher', TILE_SETTER: 'Tile Setter', ROOFER: 'Roofer',
  MASON: 'Mason', CONCRETE_FINISHER: 'Concrete Finisher', IRONWORKER: 'Ironworker',
  SHEET_METAL_WORKER: 'Sheet Metal', INSULATOR: 'Insulator', GLAZIER: 'Glazier',
  FLOORING_INSTALLER: 'Flooring Installer', CABINET_MAKER: 'Cabinet Maker',
  DEMOLITION: 'Demolition', EXCAVATOR_OPERATOR: 'Excavator Operator',
  CRANE_OPERATOR: 'Crane Operator', FOREMAN: 'Foreman', SUPERINTENDENT: 'Superintendent',
  PROJECT_MANAGER_LABOR: 'Project Manager', SAFETY_OFFICER: 'Safety Officer', OTHER_LABOR: 'Other',
};

const typeLabels: Record<string, string> = {
  NATIONAL: 'National',
  REGIONAL: 'Regional',
  LOCAL: 'Local',
  CUSTOM: 'Custom',
  IMPORTED: 'Imported',
};

export default function CostDatabaseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [db, setDb] = useState<CostDatabaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('materials');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 50, total: 0, totalPages: 0,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((value: string) => setDebouncedSearch(value), 300),
    []
  );

  // Fetch database detail
  useEffect(() => {
    async function fetchDb() {
      setLoading(true);
      try {
        const res = await apiClient.getCostDatabase(id);
        if (res.success && res.data) {
          setDb((res.data as any).data || res.data as any);
        } else {
          setError(res.error || 'Failed to load database');
        }
      } catch {
        setError('Failed to load database');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchDb();
  }, [id]);

  // Fetch items
  const fetchItems = useCallback(async (page = 1) => {
    setItemsLoading(true);
    try {
      const res = await apiClient.getCostDatabaseItems(id, {
        type: activeTab as any,
        search: debouncedSearch || undefined,
        page,
        limit: 50,
      });
      if (res.success && res.data) {
        const d = res.data as any;
        setItems(d.data || []);
        if (d.pagination) setPagination(d.pagination);
      }
    } catch {
      // silently fail
    } finally {
      setItemsLoading(false);
    }
  }, [id, activeTab, debouncedSearch]);

  useEffect(() => {
    if (id) fetchItems(1);
  }, [fetchItems, id]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearch('');
    setDebouncedSearch('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (error || !db) {
    return (
      <div className="text-center py-20">
        <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Database Not Found</h2>
        <p className="text-gray-500 mb-4">{error || 'This cost database does not exist.'}</p>
        <Link href="/cost-database">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cost Database
          </Button>
        </Link>
      </div>
    );
  }

  const totalItems =
    (db._count?.materials || 0) +
    (db._count?.laborRates || 0) +
    (db._count?.equipmentRates || 0) +
    (db._count?.assemblies || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/cost-database">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* Database Info */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">{db.name}</h1>
            <Badge variant={db.isActive ? 'default' : 'secondary'} className="text-xs">
              {db.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {typeLabels[db.type] || db.type}
            </Badge>
          </div>
          {db.description && (
            <p className="text-gray-600 mt-1">{db.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {db.region}
            </span>
            <span className="flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              v{db.version}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(db.effectiveDate).toLocaleDateString()}
            </span>
            {db.source && (
              <span className="text-gray-400">Source: {db.source}</span>
            )}
          </div>
        </div>
        <Link href="/cost-database/import">
          <Button className="bg-amber-600 hover:bg-amber-700">
            <Database className="h-4 w-4 mr-2" />
            Import More
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{totalItems.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Total Items</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{(db._count?.materials || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Materials</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{(db._count?.laborRates || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Labor Rates</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{(db._count?.equipmentRates || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Equipment</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{(db._count?.assemblies || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Assemblies</p>
        </Card>
      </div>

      {/* Items Table */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="materials" className="flex items-center gap-1 text-sm">
            <Package className="h-3.5 w-3.5" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="labor" className="flex items-center gap-1 text-sm">
            <Wrench className="h-3.5 w-3.5" />
            Labor
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-1 text-sm">
            <Truck className="h-3.5 w-3.5" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="assemblies" className="flex items-center gap-1 text-sm">
            <Layers className="h-3.5 w-3.5" />
            Assemblies
          </TabsTrigger>
        </TabsList>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={search}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
        </div>

        {/* Materials Tab */}
        <TabsContent value="materials">
          <Card>
            <CardHeader className="py-3">
              <CardDescription>
                {itemsLoading ? 'Loading...' : `${pagination.total} materials`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                    <div className="col-span-1">CSI</div>
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2 text-right">Unit Cost</div>
                    <div className="col-span-1 text-right">Waste</div>
                    <div className="col-span-2">Supplier</div>
                  </div>
                  {items.map((item: any) => (
                    <div key={item.id} className="grid grid-cols-12 gap-3 px-3 py-2.5 border rounded hover:bg-accent/50 transition-colors items-center text-sm">
                      <div className="col-span-1 font-mono text-xs">{item.csiCode || '--'}</div>
                      <div className="col-span-3 font-medium truncate">{item.name}</div>
                      <div className="col-span-2">
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[item.category] || item.category}
                        </Badge>
                      </div>
                      <div className="col-span-1 text-muted-foreground">{item.unit}</div>
                      <div className="col-span-2 text-right font-medium">{formatCurrency(Number(item.unitCost))}</div>
                      <div className="col-span-1 text-right text-muted-foreground">
                        {item.wasteFactor ? `${(Number(item.wasteFactor) * 100).toFixed(0)}%` : '--'}
                      </div>
                      <div className="col-span-2 text-muted-foreground truncate">{item.supplier || '--'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>No materials found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labor Tab */}
        <TabsContent value="labor">
          <Card>
            <CardHeader className="py-3">
              <CardDescription>
                {itemsLoading ? 'Loading...' : `${pagination.total} labor rates`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                    <div className="col-span-3">Trade</div>
                    <div className="col-span-2">Classification</div>
                    <div className="col-span-2 text-right">Base Rate</div>
                    <div className="col-span-2 text-right">Total Rate</div>
                    <div className="col-span-1 text-right">OT</div>
                    <div className="col-span-2 text-center">Flags</div>
                  </div>
                  {items.map((rate: any) => (
                    <div key={rate.id} className="grid grid-cols-12 gap-3 px-3 py-2.5 border rounded hover:bg-accent/50 transition-colors items-center text-sm">
                      <div className="col-span-3 font-medium">{tradeLabels[rate.trade] || rate.trade}</div>
                      <div className="col-span-2 text-muted-foreground truncate">{rate.classification || '--'}</div>
                      <div className="col-span-2 text-right">{formatCurrency(Number(rate.baseRate))}/hr</div>
                      <div className="col-span-2 text-right font-medium">{formatCurrency(Number(rate.totalRate))}/hr</div>
                      <div className="col-span-1 text-right text-muted-foreground">
                        {rate.overtimeMultiplier ? `${Number(rate.overtimeMultiplier)}x` : '1.5x'}
                      </div>
                      <div className="col-span-2 flex gap-1 justify-center">
                        {rate.prevailingWage && <Badge variant="outline" className="text-xs">PW</Badge>}
                        {rate.unionRate && <Badge variant="outline" className="text-xs">Union</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Wrench className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>No labor rates found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment">
          <Card>
            <CardHeader className="py-3">
              <CardDescription>
                {itemsLoading ? 'Loading...' : `${pagination.total} equipment rates`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                    <div className="col-span-3">Equipment</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2 text-right">Daily</div>
                    <div className="col-span-2 text-right">Weekly</div>
                    <div className="col-span-2 text-right">Monthly</div>
                    <div className="col-span-1 text-center">Op?</div>
                  </div>
                  {items.map((equip: any) => (
                    <div key={equip.id} className="grid grid-cols-12 gap-3 px-3 py-2.5 border rounded hover:bg-accent/50 transition-colors items-center text-sm">
                      <div className="col-span-3 font-medium truncate">{equip.name}</div>
                      <div className="col-span-2">
                        <Badge variant="secondary" className="text-xs">
                          {(equip.category || '').replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right">{formatCurrency(Number(equip.dailyRate))}/day</div>
                      <div className="col-span-2 text-right">{equip.weeklyRate ? `${formatCurrency(Number(equip.weeklyRate))}/wk` : '--'}</div>
                      <div className="col-span-2 text-right font-medium">{equip.monthlyRate ? `${formatCurrency(Number(equip.monthlyRate))}/mo` : '--'}</div>
                      <div className="col-span-1 text-center text-xs text-muted-foreground">
                        {equip.operatorRequired ? 'Yes' : 'No'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Truck className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>No equipment found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assemblies Tab */}
        <TabsContent value="assemblies">
          <Card>
            <CardHeader className="py-3">
              <CardDescription>
                {itemsLoading ? 'Loading...' : `${pagination.total} assemblies`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : items.length > 0 ? (
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-muted/50 rounded text-xs font-medium text-muted-foreground">
                    <div className="col-span-1">CSI</div>
                    <div className="col-span-3">Name</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2 text-right">Material</div>
                    <div className="col-span-2 text-right">Labor</div>
                    <div className="col-span-1 text-right">Equip</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {items.map((asm: any) => {
                    const total = Number(asm.materialCost || 0) + Number(asm.laborCost || 0) + Number(asm.equipmentCost || 0);
                    return (
                      <div key={asm.id} className="grid grid-cols-12 gap-3 px-3 py-2.5 border rounded hover:bg-accent/50 transition-colors items-center text-sm">
                        <div className="col-span-1 font-mono text-xs">{asm.csiCode || '--'}</div>
                        <div className="col-span-3 font-medium truncate">{asm.name}</div>
                        <div className="col-span-1 text-muted-foreground">{asm.unit}</div>
                        <div className="col-span-2 text-right">{formatCurrency(Number(asm.materialCost || 0))}</div>
                        <div className="col-span-2 text-right">{formatCurrency(Number(asm.laborCost || 0))}</div>
                        <div className="col-span-1 text-right">{formatCurrency(Number(asm.equipmentCost || 0))}</div>
                        <div className="col-span-2 text-right font-medium">{formatCurrency(total)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                  <p>No assemblies found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || itemsLoading}
              onClick={() => fetchItems(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages || itemsLoading}
              onClick={() => fetchItems(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

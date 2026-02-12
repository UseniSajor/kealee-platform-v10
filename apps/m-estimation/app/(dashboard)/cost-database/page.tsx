'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Search,
  Database,
  Loader2,
  Package,
  Wrench,
  Truck,
  RefreshCw,
} from 'lucide-react';
import { formatCurrency, debounce } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface MaterialItem {
  id: string;
  csiCode?: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  wasteFactor?: number;
  supplier?: string;
  leadTimeDays?: number;
}

interface LaborRate {
  id: string;
  trade: string;
  baseRate: number;
  burdenRate: number;
  totalRate: number;
  overtimeMultiplier?: number;
  prevailingWage?: boolean;
  unionRate?: boolean;
}

interface EquipmentRate {
  id: string;
  name: string;
  category: string;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  operatorRequired?: boolean;
  fuelCost?: number;
  mobilizationCost?: number;
}

const csiDivisions = [
  { code: '03', label: 'Concrete' },
  { code: '04', label: 'Masonry' },
  { code: '05', label: 'Metals' },
  { code: '06', label: 'Wood/Plastics/Composites' },
  { code: '07', label: 'Thermal/Moisture' },
  { code: '08', label: 'Openings' },
  { code: '09', label: 'Finishes' },
  { code: '10', label: 'Specialties' },
  { code: '11', label: 'Equipment' },
  { code: '12', label: 'Furnishings' },
  { code: '21', label: 'Fire Suppression' },
  { code: '22', label: 'Plumbing' },
  { code: '23', label: 'HVAC' },
  { code: '26', label: 'Electrical' },
  { code: '31', label: 'Earthwork' },
  { code: '32', label: 'Exterior Improvements' },
  { code: '33', label: 'Utilities' },
];

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

export default function CostDatabasePage() {
  const [activeTab, setActiveTab] = useState('materials');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [equipmentRates, setEquipmentRates] = useState<EquipmentRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((value: string) => setDebouncedSearch(value), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        if (activeTab === 'materials') {
          const params: { search?: string; division?: string } = {};
          if (debouncedSearch) params.search = debouncedSearch;
          if (divisionFilter !== 'all') params.division = divisionFilter;
          const res = await apiClient.getMaterials(params);
          if (res.success && res.data) {
            const data = res.data as any;
            setMaterials(Array.isArray(data) ? data : (data.materials || data.items || []));
          } else {
            setError(res.error || 'Failed to load materials');
          }
        } else if (activeTab === 'labor') {
          const res = await apiClient.getLaborRates(debouncedSearch || undefined);
          if (res.success && res.data) {
            const data = res.data as any;
            setLaborRates(Array.isArray(data) ? data : (data.rates || data.items || []));
          } else {
            setError(res.error || 'Failed to load labor rates');
          }
        } else if (activeTab === 'equipment') {
          const res = await apiClient.getEquipmentRates();
          if (res.success && res.data) {
            const data = res.data as any;
            setEquipmentRates(Array.isArray(data) ? data : (data.rates || data.items || []));
          } else {
            setError(res.error || 'Failed to load equipment rates');
          }
        }
      } catch {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [activeTab, debouncedSearch, divisionFilter]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery('');
    setDebouncedSearch('');
    setDivisionFilter('all');
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Cost Database</h1>
        <p className="text-muted-foreground mt-1">
          Browse materials, labor rates, and equipment costs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="labor" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Labor
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Equipment
          </TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search materials by name or CSI code..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
                <select
                  value={divisionFilter}
                  onChange={(e) => setDivisionFilter(e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="all">All Divisions</option>
                  {csiDivisions.map((div) => (
                    <option key={div.code} value={div.code}>
                      Div {div.code} - {div.label}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Materials</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${materials.length} materials found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
                  <span className="text-muted-foreground">Loading materials...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-3">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              ) : materials.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-md text-sm font-medium text-muted-foreground">
                    <div className="col-span-1">CSI</div>
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-1">Unit</div>
                    <div className="col-span-2 text-right">Unit Cost</div>
                    <div className="col-span-1 text-right">Waste %</div>
                    <div className="col-span-2">Supplier</div>
                  </div>
                  {materials.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-accent/50 transition-colors items-center"
                    >
                      <div className="col-span-1 text-sm font-mono">{item.csiCode || '--'}</div>
                      <div className="col-span-3">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[item.category] || item.category}
                        </Badge>
                      </div>
                      <div className="col-span-1 text-sm text-muted-foreground">{item.unit}</div>
                      <div className="col-span-2 text-right text-sm font-medium">
                        {formatCurrency(item.unitCost)}
                      </div>
                      <div className="col-span-1 text-right text-sm text-muted-foreground">
                        {item.wasteFactor ? `${(item.wasteFactor * 100).toFixed(0)}%` : '--'}
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground truncate">
                        {item.supplier || '--'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No materials found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || divisionFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'No materials in the database yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Labor Rates Tab */}
        <TabsContent value="labor" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by trade..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Labor Rates</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${laborRates.length} trades found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
                  <span className="text-muted-foreground">Loading labor rates...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-3">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              ) : laborRates.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-md text-sm font-medium text-muted-foreground">
                    <div className="col-span-3">Trade</div>
                    <div className="col-span-2 text-right">Base Rate</div>
                    <div className="col-span-2 text-right">Burden</div>
                    <div className="col-span-2 text-right">Total Rate</div>
                    <div className="col-span-1 text-right">OT</div>
                    <div className="col-span-2 text-center">Flags</div>
                  </div>
                  {laborRates.map((rate) => (
                    <div
                      key={rate.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-accent/50 transition-colors items-center"
                    >
                      <div className="col-span-3">
                        <p className="text-sm font-medium">{tradeLabels[rate.trade] || rate.trade}</p>
                      </div>
                      <div className="col-span-2 text-right text-sm">
                        {formatCurrency(rate.baseRate)}/hr
                      </div>
                      <div className="col-span-2 text-right text-sm text-muted-foreground">
                        {formatCurrency(rate.burdenRate)}/hr
                      </div>
                      <div className="col-span-2 text-right text-sm font-medium">
                        {formatCurrency(rate.totalRate)}/hr
                      </div>
                      <div className="col-span-1 text-right text-sm text-muted-foreground">
                        {rate.overtimeMultiplier ? `${rate.overtimeMultiplier}x` : '1.5x'}
                      </div>
                      <div className="col-span-2 flex gap-1 justify-center">
                        {rate.prevailingWage && (
                          <Badge variant="outline" className="text-xs">PW</Badge>
                        )}
                        {rate.unionRate && (
                          <Badge variant="outline" className="text-xs">Union</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No labor rates found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search' : 'No labor rates in the database yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Rates Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipment Rates</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${equipmentRates.length} equipment items found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
                  <span className="text-muted-foreground">Loading equipment rates...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-3">{error}</p>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              ) : equipmentRates.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-md text-sm font-medium text-muted-foreground">
                    <div className="col-span-3">Equipment</div>
                    <div className="col-span-1">Category</div>
                    <div className="col-span-2 text-right">Daily</div>
                    <div className="col-span-2 text-right">Weekly</div>
                    <div className="col-span-2 text-right">Monthly</div>
                    <div className="col-span-2 text-center">Details</div>
                  </div>
                  {equipmentRates.map((equip) => (
                    <div
                      key={equip.id}
                      className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-accent/50 transition-colors items-center"
                    >
                      <div className="col-span-3">
                        <p className="text-sm font-medium">{equip.name}</p>
                      </div>
                      <div className="col-span-1">
                        <Badge variant="secondary" className="text-xs">
                          {equip.category.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="col-span-2 text-right text-sm">
                        {formatCurrency(equip.dailyRate)}/day
                      </div>
                      <div className="col-span-2 text-right text-sm">
                        {formatCurrency(equip.weeklyRate)}/wk
                      </div>
                      <div className="col-span-2 text-right text-sm font-medium">
                        {formatCurrency(equip.monthlyRate)}/mo
                      </div>
                      <div className="col-span-2 flex flex-col items-center gap-1 text-xs text-muted-foreground">
                        {equip.operatorRequired && (
                          <Badge variant="outline" className="text-xs">Operator Req.</Badge>
                        )}
                        {equip.fuelCost && (
                          <span>Fuel: {formatCurrency(equip.fuelCost)}/hr</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No equipment found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search' : 'No equipment rates in the database yet'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

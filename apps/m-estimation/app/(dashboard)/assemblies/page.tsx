'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  Plus,
  Search,
  Package,
  Loader2,
  Layers,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, debounce } from '@/lib/utils';
import { apiClient } from '@/lib/api';

interface Assembly {
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
  itemCount?: number;
  _count?: { items: number };
}

const categoryLabels: Record<string, string> = {
  SITEWORK: 'Sitework',
  FOUNDATIONS: 'Foundations',
  CONCRETE_FLATWORK: 'Concrete Flatwork',
  FRAMING: 'Framing',
  ROOFING_ASSEMBLY: 'Roofing',
  EXTERIOR_FINISHES: 'Exterior Finishes',
  INTERIOR_FINISHES: 'Interior Finishes',
  DRYWALL: 'Drywall',
  PAINTING: 'Painting',
  FLOORING: 'Flooring',
  TILE: 'Tile',
  CABINETRY: 'Cabinetry',
  COUNTERTOPS: 'Countertops',
  DOORS_HARDWARE: 'Doors & Hardware',
  WINDOWS: 'Windows',
  PLUMBING_ROUGH: 'Plumbing Rough',
  PLUMBING_FINISH: 'Plumbing Finish',
  ELECTRICAL_ROUGH: 'Electrical Rough',
  ELECTRICAL_FINISH: 'Electrical Finish',
  HVAC_ROUGH: 'HVAC Rough',
  HVAC_FINISH: 'HVAC Finish',
  INSULATION_ASSEMBLY: 'Insulation',
  DEMOLITION_ASSEMBLY: 'Demolition',
  CLEANUP: 'Cleanup',
  PERMITS_FEES: 'Permits & Fees',
  GENERAL_CONDITIONS_ASSEMBLY: 'General Conditions',
  OTHER_ASSEMBLY: 'Other',
};

const complexityColors: Record<string, string> = {
  SIMPLE: 'bg-green-100 text-green-700',
  STANDARD: 'bg-blue-100 text-blue-700',
  COMPLEX: 'bg-orange-100 text-orange-700',
  CUSTOM_COMPLEXITY: 'bg-purple-100 text-purple-700',
};

const categories = Object.entries(categoryLabels);

export default function AssembliesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
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
    async function fetchAssemblies() {
      setIsLoading(true);
      setError(null);
      try {
        const params: { search?: string; category?: string } = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (categoryFilter !== 'all') params.category = categoryFilter;

        const response = await apiClient.getAssemblies(params);
        if (response.success && response.data) {
          const data = response.data as any;
          const items = Array.isArray(data) ? data : (data.assemblies || data.items || []);
          setAssemblies(items);
        } else {
          setError(response.error || 'Failed to load assemblies');
        }
      } catch {
        setError('Failed to load assemblies');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssemblies();
  }, [debouncedSearch, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assemblies</h1>
          <p className="text-muted-foreground mt-1">
            Pre-built cost assemblies for quick estimation
          </p>
        </div>
        <Button asChild>
          <Link href="/assemblies/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Assembly
          </Link>
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assemblies by name, code, or CSI..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="all">All Categories</option>
              {categories.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Assemblies Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
          <span className="text-muted-foreground">Loading assemblies...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : assemblies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assemblies.map((assembly) => (
            <Card key={assembly.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{assembly.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {assembly.code} {assembly.csiCode ? `| CSI ${assembly.csiCode}` : ''}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {categoryLabels[assembly.category] || assembly.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {assembly.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {assembly.description}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-semibold">{formatCurrency(assembly.unitCost)}</p>
                    <p className="text-xs text-muted-foreground">per {assembly.unit}</p>
                  </div>
                  <div className="text-center">
                    <Layers className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm font-semibold">{assembly._count?.items || assembly.itemCount || 0}</p>
                    <p className="text-xs text-muted-foreground">items</p>
                  </div>
                  <div className="text-center">
                    {assembly.complexity && (
                      <>
                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${complexityColors[assembly.complexity] || 'bg-gray-100 text-gray-700'}`}>
                          {assembly.complexity.replace('_', ' ')}
                        </div>
                      </>
                    )}
                    {assembly.laborHours && (
                      <p className="text-xs text-muted-foreground mt-1">{assembly.laborHours}h labor</p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/assemblies/${assembly.id}`}>
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No assemblies found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Create your first assembly to build reusable cost templates'}
            </p>
            {!searchQuery && categoryFilter === 'all' && (
              <Button asChild>
                <Link href="/assemblies/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assembly
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

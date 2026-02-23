'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@estimation/components/ui/button';
import { Input } from '@estimation/components/ui/input';
import { Badge } from '@estimation/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@estimation/components/ui/card';
import {
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  FileText,
  Loader2,
} from 'lucide-react';
import { formatCurrency, formatDate, debounce } from '@estimation/lib/utils';
import { apiClient } from '@estimation/lib/api';

interface EstimateItem {
  id: string;
  name: string;
  projectType?: string;
  client?: string;
  clientName?: string;
  amount: number;
  totalCost?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'outline' },
  review: { label: 'Review', variant: 'warning' },
  final: { label: 'Final', variant: 'success' },
  sent: { label: 'Sent', variant: 'secondary' },
};

export default function EstimatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [estimates, setEstimates] = useState<EstimateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounced search handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearch(value);
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSetSearch(e.target.value);
  };

  useEffect(() => {
    async function fetchEstimates() {
      setIsLoading(true);
      setError(null);
      try {
        const params: { search?: string; status?: string } = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (statusFilter !== 'all') params.status = statusFilter;

        const response = await apiClient.getEstimates(params);
        if (response.success && response.data) {
          const data = response.data as any;
          const items = Array.isArray(data) ? data : (data.estimates || data.items || []);
          setEstimates(items);
        } else {
          setError(response.error || 'Failed to load estimates');
        }
      } catch {
        setError('Failed to load estimates');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEstimates();
  }, [debouncedSearch, statusFilter]);

  const getEstimateStatus = (status: string) => {
    return statusConfig[status] || { label: status, variant: 'outline' as const };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estimates</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your cost estimates
          </p>
        </div>
        <Button asChild>
          <Link href="/estimation/estimates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Estimate
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search estimates..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('draft')}
                size="sm"
              >
                Draft
              </Button>
              <Button
                variant={statusFilter === 'review' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('review')}
                size="sm"
              >
                Review
              </Button>
              <Button
                variant={statusFilter === 'final' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('final')}
                size="sm"
              >
                Final
              </Button>
            </div>

            {/* More Filters */}
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estimates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Estimates</CardTitle>
              <CardDescription>
                {isLoading
                  ? 'Loading...'
                  : `${estimates.length} estimate${estimates.length !== 1 ? 's' : ''} found`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-3" />
              <span className="text-muted-foreground">Loading estimates...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-3">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDebouncedSearch(debouncedSearch); // trigger re-fetch
                  window.location.reload();
                }}
              >
                Retry
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted/50 rounded-md text-sm font-medium text-muted-foreground">
                <div className="col-span-3">Estimate Name</div>
                <div className="col-span-2">Client</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              {estimates.map((estimate) => {
                const statusInfo = getEstimateStatus(estimate.status);
                return (
                  <div
                    key={estimate.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg hover:bg-accent/50 transition-colors items-center"
                  >
                    <div className="col-span-3 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{estimate.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Updated {formatDate(estimate.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm truncate">
                        {estimate.client || estimate.clientName || '--'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">
                        {estimate.projectType || '--'}
                      </p>
                    </div>
                    <div className="col-span-2 text-right">
                      <p className="font-medium">
                        {formatCurrency(estimate.amount ?? estimate.totalCost ?? 0)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="col-span-1 flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/estimates/${estimate.id}/edit`}>
                          {estimate.status === 'draft' ? 'Edit' : 'View'}
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {estimates.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No estimates found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Get started by creating your first estimate'}
                  </p>
                  {!searchQuery && statusFilter === 'all' && (
                    <Button asChild>
                      <Link href="/estimation/estimates/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Estimate
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

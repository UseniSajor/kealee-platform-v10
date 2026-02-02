'use client';

import { useState } from 'react';
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
  Filter,
  Download,
  MoreVertical,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock data - will be replaced with API calls
const mockEstimates = [
  {
    id: '1',
    name: 'Residential Addition',
    projectType: 'Residential',
    client: 'John Doe',
    amount: 125450,
    status: 'draft',
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-28'),
  },
  {
    id: '2',
    name: 'Commercial TI',
    projectType: 'Commercial',
    client: 'ABC Corp',
    amount: 480200,
    status: 'review',
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-27'),
  },
  {
    id: '3',
    name: 'Kitchen Remodel',
    projectType: 'Residential',
    client: 'Jane Smith',
    amount: 67800,
    status: 'final',
    createdAt: new Date('2026-01-05'),
    updatedAt: new Date('2026-01-26'),
  },
  {
    id: '4',
    name: 'Foundation Repair',
    projectType: 'Residential',
    client: 'Bob Johnson',
    amount: 34500,
    status: 'draft',
    createdAt: new Date('2026-01-20'),
    updatedAt: new Date('2026-01-25'),
  },
  {
    id: '5',
    name: 'Warehouse Addition',
    projectType: 'Industrial',
    client: 'XYZ Manufacturing',
    amount: 875000,
    status: 'sent',
    createdAt: new Date('2025-12-15'),
    updatedAt: new Date('2026-01-24'),
  },
];

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
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredEstimates = mockEstimates.filter((estimate) => {
    const matchesSearch =
      estimate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      estimate.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || estimate.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <Link href="/dashboard/estimates/new">
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                {filteredEstimates.length} estimate
                {filteredEstimates.length !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
            {filteredEstimates.map((estimate) => (
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
                  <p className="text-sm truncate">{estimate.client}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">
                    {estimate.projectType}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="font-medium">{formatCurrency(estimate.amount)}</p>
                </div>
                <div className="col-span-2">
                  <Badge variant={statusConfig[estimate.status].variant}>
                    {statusConfig[estimate.status].label}
                  </Badge>
                </div>
                <div className="col-span-1 flex justify-end gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/estimates/${estimate.id}/edit`}>
                      {estimate.status === 'draft' ? 'Edit' : 'View'}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {filteredEstimates.length === 0 && (
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
                    <Link href="/dashboard/estimates/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Estimate
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

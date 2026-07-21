'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@permits/src/components/ui/card';
import { Button } from '@permits/src/components/ui/button';
import { MapPin, Settings, Users, BarChart3, Search, ChevronRight } from 'lucide-react';

const jurisdictions = [
  {
    id: 'dc',
    name: 'Washington, DC',
    code: 'DCRA',
    status: 'Active',
    permits: 145,
    avgProcessing: '12 days',
    inspectors: 8,
  },
  {
    id: 'mc-md',
    name: 'Montgomery County, MD',
    code: 'DPS',
    status: 'Active',
    permits: 89,
    avgProcessing: '15 days',
    inspectors: 12,
  },
  {
    id: 'pg-md',
    name: "Prince George's County, MD",
    code: 'DPIE',
    status: 'Active',
    permits: 67,
    avgProcessing: '18 days',
    inspectors: 10,
  },
  {
    id: 'fairfax-va',
    name: 'Fairfax County, VA',
    code: 'LDS',
    status: 'Active',
    permits: 112,
    avgProcessing: '14 days',
    inspectors: 15,
  },
  {
    id: 'arlington-va',
    name: 'Arlington County, VA',
    code: 'CPHD',
    status: 'Active',
    permits: 54,
    avgProcessing: '10 days',
    inspectors: 6,
  },
  {
    id: 'alexandria-va',
    name: 'City of Alexandria, VA',
    code: 'T&ES',
    status: 'Pending',
    permits: 0,
    avgProcessing: 'N/A',
    inspectors: 0,
  },
];

export default function JurisdictionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending'>('all');

  const filteredJurisdictions = jurisdictions.filter((j) => {
    if (statusFilter !== 'all' && j.status.toLowerCase() !== statusFilter) return false;
    if (searchQuery && !j.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPermits = jurisdictions.reduce((sum, j) => sum + j.permits, 0);
  const activeJurisdictions = jurisdictions.filter((j) => j.status === 'Active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jurisdictions</h1>
          <p className="text-gray-500 mt-1">Manage permit jurisdictions and configurations</p>
        </div>
        <Button>
          <MapPin className="h-4 w-4 mr-2" />
          Add Jurisdiction
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jurisdictions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jurisdictions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJurisdictions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Permits</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPermits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inspectors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jurisdictions.reduce((sum, j) => sum + j.inspectors, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jurisdictions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Jurisdictions List */}
      <div className="space-y-4">
        {filteredJurisdictions.map((jurisdiction) => (
          <Card key={jurisdiction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{jurisdiction.name}</h3>
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {jurisdiction.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{jurisdiction.permits} permits</span>
                      <span>•</span>
                      <span>Avg. {jurisdiction.avgProcessing}</span>
                      <span>•</span>
                      <span>{jurisdiction.inspectors} inspectors</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      jurisdiction.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {jurisdiction.status}
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/jurisdiction/configuration?jurisdictionId=${jurisdiction.id}`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                    </Link>
                    <Link href={`/dashboard/jurisdiction/metrics?jurisdictionId=${jurisdiction.id}`}>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Metrics
                      </Button>
                    </Link>
                    <Link href={`/dashboard/jurisdiction/staff?jurisdictionId=${jurisdiction.id}`}>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-1" />
                        Staff
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredJurisdictions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No jurisdictions found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your search or filter criteria</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Common jurisdiction management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/permits/dashboard/jurisdiction/onboarding"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium">Onboard New</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/permits/dashboard/jurisdiction/configuration"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium">Bulk Configure</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/permits/dashboard/jurisdiction/metrics"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium">View All Metrics</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/permits/dashboard/jurisdiction/staff"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium">Manage Staff</span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

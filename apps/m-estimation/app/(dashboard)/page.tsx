import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Plus,
  ClipboardList,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  // Mock data - will be replaced with API calls
  const stats = {
    active: 12,
    pending: 5,
    completed: 47,
  };

  const recentEstimates = [
    {
      id: '1',
      name: 'Residential Addition',
      amount: 125450,
      status: 'draft',
      updatedAt: new Date('2026-01-28'),
    },
    {
      id: '2',
      name: 'Commercial TI',
      amount: 480200,
      status: 'review',
      updatedAt: new Date('2026-01-27'),
    },
    {
      id: '3',
      name: 'Kitchen Remodel',
      amount: 67800,
      status: 'final',
      updatedAt: new Date('2026-01-26'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Estimation Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your construction cost estimates
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Estimates
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed This Month
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Estimates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Estimates</CardTitle>
          <CardDescription>
            Your most recently updated estimates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentEstimates.map((estimate) => (
              <div
                key={estimate.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{estimate.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Updated{' '}
                      {estimate.updatedAt.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">
                      ${estimate.amount.toLocaleString()}
                    </p>
                    <Badge
                      variant={
                        estimate.status === 'draft'
                          ? 'outline'
                          : estimate.status === 'review'
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {estimate.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/estimates/${estimate.id}/edit`}>
                      {estimate.status === 'draft' ? 'Edit' : 'View'}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild className="h-auto py-6 flex-col gap-2">
              <Link href="/dashboard/estimates/new">
                <Plus className="h-6 w-6" />
                <span>New Estimate</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
            >
              <Link href="/dashboard/estimates/new/from-bid">
                <ClipboardList className="h-6 w-6" />
                <span>From Bid Request</span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
            >
              <Link href="/dashboard/assemblies">
                <Upload className="h-6 w-6" />
                <span>Browse Assemblies</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights (Placeholder) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">💡</span>
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your estimates average 8% under market this month. Consider raising
            your profit margins to improve profitability.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

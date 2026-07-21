'use client';

import React, {useState, useEffect} from 'react';
import {Card} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Badge} from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  TrendingUp,
  Calendar,
  Award,
  Smartphone,
  Settings,
  Filter,
  Search,
} from 'lucide-react';
import {JurisdictionStaff, StaffRole} from '@/types/jurisdiction-staff';
import {workloadBalancerService} from '@/services/jurisdiction-staff/workload-balancer';
import {performanceMetricsService} from '@/services/jurisdiction-staff/performance-metrics';
import {availabilitySchedulerService} from '@/services/jurisdiction-staff/availability-scheduler';
import {trainingCertificationService} from '@/services/jurisdiction-staff/training-certification';
import {mobileProvisioningService} from '@/services/jurisdiction-staff/mobile-provisioning';

interface StaffManagementProps {
  jurisdictionId: string;
}

export function StaffManagement({jurisdictionId}: StaffManagementProps) {
  const [staff, setStaff] = useState<JurisdictionStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<JurisdictionStaff | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');

  useEffect(() => {
    loadStaff();
  }, [jurisdictionId]);

  const loadStaff = async () => {
    try {
      const response = await fetch(`/api/jurisdictions/${jurisdictionId}/staff`);
      if (!response.ok) throw new Error('Failed to load staff');
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staff.filter(s => {
    const matchesSearch =
      searchQuery === '' ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const workloadStats = workloadBalancerService.getWorkloadStats(staff);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading staff...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-gray-500 mt-1">
            {staff.length} staff members • {workloadStats.overworkedCount} overworked • {workloadStats.underworkedCount} underworked
          </p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Staff</p>
              <p className="text-2xl font-bold">{staff.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Workload</p>
              <p className="text-2xl font-bold">{workloadStats.avgWorkload}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Utilization</p>
              <p className="text-2xl font-bold">{Math.round(workloadStats.utilizationRate * 100)}%</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Mobile</p>
              <p className="text-2xl font-bold">
                {mobileProvisioningService.getAllDevices().filter(d => d.isActive).length}
              </p>
            </div>
            <Smartphone className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as StaffRole | 'all')}
            className="px-4 py-2 border rounded-lg">
            <option value="all">All Roles</option>
            <option value="ADMINISTRATOR">Administrator</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="PLAN_REVIEWER">Plan Reviewer</option>
            <option value="INSPECTOR">Inspector</option>
            <option value="PERMIT_COORDINATOR">Permit Coordinator</option>
          </select>
        </div>
      </Card>

      {/* Staff List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="training">Training & Certifications</TabsTrigger>
          <TabsTrigger value="mobile">Mobile Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {filteredStaff.map((member) => (
            <StaffCard
              key={member.id}
              staff={member}
              onClick={() => setSelectedStaff(member)}
            />
          ))}
        </TabsContent>

        <TabsContent value="workload">
          <WorkloadView staff={filteredStaff} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceView staff={filteredStaff} />
        </TabsContent>

        <TabsContent value="training">
          <TrainingView staff={filteredStaff} />
        </TabsContent>

        <TabsContent value="mobile">
          <MobileDevicesView staff={filteredStaff} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StaffCard({
  staff,
  onClick,
}: {
  staff: JurisdictionStaff;
  onClick: () => void;
}) {
  const workloadPercent = (staff.currentWorkload / staff.maxWorkload) * 100;
  const workloadColor =
    workloadPercent >= 90 ? 'bg-red-500' : workloadPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <Card className="p-4 cursor-pointer hover:bg-gray-50" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-semibold">
              {staff.firstName[0]}{staff.lastName[0]}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">
                {staff.firstName} {staff.lastName}
              </h3>
              <Badge variant="outline">{staff.role.replace('_', ' ')}</Badge>
              {!staff.isActive && <Badge variant="destructive">Inactive</Badge>}
            </div>
            <p className="text-sm text-gray-500">{staff.email}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span>{staff.disciplines.length} disciplines</span>
              <span>{staff.certifications.length} certifications</span>
              {staff.mobileDeviceId && (
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Mobile
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500">Workload</span>
              <span className="font-semibold">
                {staff.currentWorkload}/{staff.maxWorkload}
              </span>
            </div>
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${workloadColor}`}
                style={{width: `${Math.min(100, workloadPercent)}%`}}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function WorkloadView({staff}: {staff: JurisdictionStaff[]}) {
  const stats = workloadBalancerService.getWorkloadStats(staff);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Workload Statistics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Average Workload</p>
            <p className="text-2xl font-bold">{stats.avgWorkload}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Utilization Rate</p>
            <p className="text-2xl font-bold">{Math.round(stats.utilizationRate * 100)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Overworked</p>
            <p className="text-2xl font-bold text-red-600">{stats.overworkedCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Underworked</p>
            <p className="text-2xl font-bold text-green-600">{stats.underworkedCount}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {staff.map((member) => {
          const percent = (member.currentWorkload / member.maxWorkload) * 100;
          return (
            <Card key={member.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{member.role}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-48">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{member.currentWorkload}/{member.maxWorkload}</span>
                      <span>{Math.round(percent)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          percent >= 90 ? 'bg-red-500' : percent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{width: `${Math.min(100, percent)}%`}}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PerformanceView({staff}: {staff: JurisdictionStaff[]}) {
  return (
    <div className="space-y-4">
      {staff.map((member) => (
        <Card key={member.id} className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">
                {member.firstName} {member.lastName}
              </h3>
              <p className="text-sm text-gray-500">{member.role}</p>
            </div>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Reviews Completed</p>
              <p className="text-xl font-bold">{member.reviewsCompleted}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Inspections Completed</p>
              <p className="text-xl font-bold">{member.inspectionsCompleted}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Accuracy</p>
              <p className="text-xl font-bold">
                {member.avgAccuracy ? Math.round(member.avgAccuracy * 100) : 'N/A'}%
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Review Time</p>
              <p className="text-xl font-bold">
                {member.avgReviewTime ? `${member.avgReviewTime}m` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TrainingView({staff}: {staff: JurisdictionStaff[]}) {
  return (
    <div className="space-y-4">
      {staff.map((member) => {
        const compliance = trainingCertificationService.getTrainingCompliance(member);
        const certSummary = trainingCertificationService.getCertificationSummary(member);

        return (
          <Card key={member.id} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">
                  {member.firstName} {member.lastName}
                </h3>
                <p className="text-sm text-gray-500">{member.role}</p>
              </div>
              <Badge variant={compliance.compliant ? 'default' : 'destructive'}>
                {compliance.compliant ? 'Compliant' : 'Non-Compliant'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Training</h4>
                <div className="space-y-1 text-sm">
                  <p>Total Hours: {compliance.totalHours}</p>
                  <p>Required: {compliance.requiredHours || 'N/A'}</p>
                  <p>Expiring Soon: {compliance.expiringSoon}</p>
                  <p>Expired: {compliance.expired}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Certifications</h4>
                <div className="space-y-1 text-sm">
                  <p>Total: {certSummary.total}</p>
                  <p>Active: {certSummary.active}</p>
                  <p>Expiring Soon: {certSummary.expiringSoon}</p>
                  <p>Expired: {certSummary.expired}</p>
                  <p>Verified: {certSummary.verified}</p>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function MobileDevicesView({staff}: {staff: JurisdictionStaff[]}) {
  const allDevices = mobileProvisioningService.getAllDevices();
  const stats = mobileProvisioningService.getDeviceStatistics();

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Device Statistics</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Total Devices</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">iOS</p>
            <p className="text-2xl font-bold">{stats.byType.ios}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Android</p>
            <p className="text-2xl font-bold">{stats.byType.android}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {allDevices.map((device) => {
          const staffMember = staff.find(s => s.id === device.staffId);
          return (
            <Card key={device.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {device.deviceName || device.deviceId} • {device.deviceType.toUpperCase()}
                  </p>
                  {device.appVersion && (
                    <p className="text-xs text-gray-400">App v{device.appVersion}</p>
                  )}
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      device.isActive && device.provisioningStatus === 'provisioned'
                        ? 'default'
                        : 'destructive'
                    }>
                    {device.provisioningStatus}
                  </Badge>
                  <p className="text-xs text-gray-400 mt-1">
                    Last seen: {new Date(device.lastSeen).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

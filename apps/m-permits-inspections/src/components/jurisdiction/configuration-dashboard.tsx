/**
 * Jurisdiction Configuration Dashboard
 * Manage fee schedules, permit types, disciplines, zones, rules, and calendar
 */

'use client';

import {useState} from 'react';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Settings, DollarSign, FileText, Users, MapPin, Calendar, Rules} from 'lucide-react';
import {FeeScheduleEditor} from './fee-schedule-editor';
import {PermitTypeConfig} from './permit-type-config';
import {ReviewDisciplineConfig} from './review-discipline-config';
import {InspectorZoneManager} from './inspector-zone-manager';
import {BusinessRulesEditor} from './business-rules-editor';
import {CalendarManager} from './calendar-manager';

interface ConfigurationDashboardProps {
  jurisdictionId: string;
}

export function ConfigurationDashboard({jurisdictionId}: ConfigurationDashboardProps) {
  const [activeTab, setActiveTab] = useState('fees');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Jurisdiction Configuration</h1>
        <p className="text-gray-600 mt-2">
          Manage fee schedules, permit types, review disciplines, and business rules
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="fees">
            <DollarSign className="w-4 h-4 mr-2" />
            Fee Schedules
          </TabsTrigger>
          <TabsTrigger value="permit-types">
            <FileText className="w-4 h-4 mr-2" />
            Permit Types
          </TabsTrigger>
          <TabsTrigger value="disciplines">
            <Settings className="w-4 h-4 mr-2" />
            Disciplines
          </TabsTrigger>
          <TabsTrigger value="zones">
            <MapPin className="w-4 h-4 mr-2" />
            Inspector Zones
          </TabsTrigger>
          <TabsTrigger value="rules">
            <Rules className="w-4 h-4 mr-2" />
            Business Rules
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fees">
          <FeeScheduleEditor jurisdictionId={jurisdictionId} />
        </TabsContent>

        <TabsContent value="permit-types">
          <PermitTypeConfig jurisdictionId={jurisdictionId} />
        </TabsContent>

        <TabsContent value="disciplines">
          <ReviewDisciplineConfig jurisdictionId={jurisdictionId} />
        </TabsContent>

        <TabsContent value="zones">
          <InspectorZoneManager jurisdictionId={jurisdictionId} />
        </TabsContent>

        <TabsContent value="rules">
          <BusinessRulesEditor jurisdictionId={jurisdictionId} />
        </TabsContent>

        <TabsContent value="calendar">
          <CalendarManager jurisdictionId={jurisdictionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Placeholder components - would be fully implemented
function FeeScheduleEditor({jurisdictionId}: {jurisdictionId: string}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Schedule Management</CardTitle>
        <CardDescription>
          Configure fee calculation rules with formula builder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Fee schedule editor component would go here</p>
      </CardContent>
    </Card>
  );
}

function PermitTypeConfig({jurisdictionId}: {jurisdictionId: string}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permit Type Configuration</CardTitle>
        <CardDescription>Configure permit types and requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Permit type configuration component would go here</p>
      </CardContent>
    </Card>
  );
}

function ReviewDisciplineConfig({jurisdictionId}: {jurisdictionId: string}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Discipline Setup</CardTitle>
        <CardDescription>Configure review disciplines</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Review discipline configuration component would go here</p>
      </CardContent>
    </Card>
  );
}

function InspectorZoneManager({jurisdictionId}: {jurisdictionId: string}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspector Zone Management</CardTitle>
        <CardDescription>Assign inspectors to geographic zones</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Inspector zone manager component would go here</p>
      </CardContent>
    </Card>
  );
}

function BusinessRulesEditor({jurisdictionId}: {jurisdictionId: string}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Rules Configuration</CardTitle>
        <CardDescription>
          Configure automatic approvals, expedited thresholds, and workflow rules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Business rules editor component would go here</p>
      </CardContent>
    </Card>
  );
}

function CalendarManager({jurisdictionId}: {jurisdictionId: string}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holiday & Closure Calendar</CardTitle>
        <CardDescription>Manage holidays and closure periods</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Calendar manager component would go here</p>
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CalendarManagerProps {
  jurisdictionId: string;
}

export function CalendarManager({ jurisdictionId }: CalendarManagerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Holiday & Closure Calendar</CardTitle>
        <CardDescription>Manage holidays and closure periods</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Calendar manager for jurisdiction {jurisdictionId}</p>
        {/* TODO: Implement calendar manager */}
      </CardContent>
    </Card>
  );
}

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PermitTypeConfigProps {
  jurisdictionId: string;
}

export function PermitTypeConfig({ jurisdictionId }: PermitTypeConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permit Type Configuration</CardTitle>
        <CardDescription>Configure permit types and requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Permit type configuration component for jurisdiction {jurisdictionId}</p>
        {/* TODO: Implement permit type configuration */}
      </CardContent>
    </Card>
  );
}

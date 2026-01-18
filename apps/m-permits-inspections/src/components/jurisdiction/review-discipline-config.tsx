'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ReviewDisciplineConfigProps {
  jurisdictionId: string;
}

export function ReviewDisciplineConfig({ jurisdictionId }: ReviewDisciplineConfigProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Discipline Setup</CardTitle>
        <CardDescription>Configure review disciplines</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Review discipline configuration for jurisdiction {jurisdictionId}</p>
        {/* TODO: Implement review discipline configuration */}
      </CardContent>
    </Card>
  );
}

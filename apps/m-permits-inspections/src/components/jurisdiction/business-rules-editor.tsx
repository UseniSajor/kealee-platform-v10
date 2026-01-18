'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BusinessRulesEditorProps {
  jurisdictionId: string;
}

export function BusinessRulesEditor({ jurisdictionId }: BusinessRulesEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Rules Configuration</CardTitle>
        <CardDescription>
          Configure automatic approvals, expedited thresholds, and workflow rules
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Business rules editor for jurisdiction {jurisdictionId}</p>
        {/* TODO: Implement business rules editor */}
      </CardContent>
    </Card>
  );
}

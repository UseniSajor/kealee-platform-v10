'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeeScheduleEditorProps {
  jurisdictionId: string;
}

export function FeeScheduleEditor({ jurisdictionId }: FeeScheduleEditorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Schedule Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Fee schedule configuration for jurisdiction {jurisdictionId}
        </p>
        {/* TODO: Implement fee schedule editor */}
      </CardContent>
    </Card>
  );
}

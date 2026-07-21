"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"

export function UpcomingInspections() {
  return (
    <Card className="py-0">
      <CardHeader>
        <CardTitle className="text-base">Upcoming inspections</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-sm text-neutral-600">Placeholder: inspections list will appear here.</div>
      </CardContent>
    </Card>
  )
}


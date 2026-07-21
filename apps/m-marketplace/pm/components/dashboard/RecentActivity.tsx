"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"

export function RecentActivity() {
  return (
    <Card className="py-0">
      <CardHeader>
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-sm text-neutral-600">Placeholder: recent activity feed will appear here.</div>
      </CardContent>
    </Card>
  )
}


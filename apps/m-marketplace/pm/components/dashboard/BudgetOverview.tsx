"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"

export function BudgetOverview() {
  return (
    <Card className="py-0">
      <CardHeader>
        <CardTitle className="text-base">Budget overview</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="text-sm text-neutral-600">Placeholder: budget summary charts will appear here.</div>
      </CardContent>
    </Card>
  )
}


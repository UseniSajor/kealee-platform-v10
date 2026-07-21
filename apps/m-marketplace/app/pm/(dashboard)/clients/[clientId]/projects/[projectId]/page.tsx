import Link from "next/link"
import { Download, Printer, Share2 } from "lucide-react"

import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { cn } from "@pm/lib/utils"
import { ProjectTabs } from "@pm/components/projects/ProjectTabs"

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>
}) {
  const { clientId, projectId } = await params

  const base = `/pm/clients/${clientId}/pm/projects/${projectId}`

  return (
    <div className="space-y-4">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-600">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link className="hover:underline" href="/">
              Dashboard
            </Link>
          </li>
          <li aria-hidden="true" className="text-neutral-400">
            /
          </li>
          <li>
            <Link className="hover:underline" href="/pm/clients">
              Clients
            </Link>
          </li>
          <li aria-hidden="true" className="text-neutral-400">
            /
          </li>
          <li>
            <Link className="hover:underline" href={`/pm/clients/${clientId}`}>
              {clientId}
            </Link>
          </li>
          <li aria-hidden="true" className="text-neutral-400">
            /
          </li>
          <li className="text-neutral-900 font-medium">Project {projectId}</li>
        </ol>
      </nav>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold truncate">Project {projectId}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-600">
            <span>
              <span className="text-neutral-500">ID:</span> {projectId}
            </span>
            <span aria-hidden="true" className="text-neutral-300">
              •
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-neutral-500">Status:</span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  "bg-emerald-50 text-emerald-700 border-emerald-200"
                )}
              >
                Active
              </span>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/pm/reports?print=1`}>
              <Printer className="h-4 w-4" />
              Print report
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/pm/reports?export=1`}>
              <Download className="h-4 w-4" />
              Export data
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/overview?share=1`}>
              <Share2 className="h-4 w-4" />
              Share
            </Link>
          </Button>
        </div>
      </div>

      <ProjectTabs clientId={clientId} projectId={projectId} />

      <Card className="py-0">
        <CardHeader>
          <CardTitle className="text-base">Project dashboard</CardTitle>
        </CardHeader>
        <CardContent className="pb-4 space-y-3">
          <p className="text-sm text-neutral-600">
            Use the tabs above to navigate project details. This landing page can be used for quick project summary widgets.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href={`${base}/overview`}
              className="rounded-lg border bg-white p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="font-medium text-neutral-900">Overview</div>
              <div className="text-sm text-neutral-600 mt-1">Key project details and KPIs.</div>
            </Link>
            <Link
              href={`${base}/timeline`}
              className="rounded-lg border bg-white p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="font-medium text-neutral-900">Timeline</div>
              <div className="text-sm text-neutral-600 mt-1">Milestones, schedule, and dates.</div>
            </Link>
            <Link
              href={`${base}/pm/documents`}
              className="rounded-lg border bg-white p-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="font-medium text-neutral-900">Documents</div>
              <div className="text-sm text-neutral-600 mt-1">Plans, specs, and uploads.</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


import { PermitSchedule } from "@pm/components/projects/PermitSchedule"

export default async function ProjectPermitsPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>
}) {
  const { clientId, projectId } = await params

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Permits & inspections</h1>
        <p className="text-neutral-600 mt-1">
          Client: {clientId} • Project: {projectId}
        </p>
      </div>

      <PermitSchedule projectId={projectId} />
    </div>
  )
}


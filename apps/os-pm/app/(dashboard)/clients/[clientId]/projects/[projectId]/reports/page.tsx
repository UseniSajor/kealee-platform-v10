export default async function ProjectReportsPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>
}) {
  const { clientId, projectId } = await params

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <p className="text-neutral-600">
        Client: {clientId} • Project: {projectId}
      </p>
    </div>
  )
}


import { BudgetTracker } from "@pm/components/pm/projects/BudgetTracker"

export default async function ProjectBudgetPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>
}) {
  const { clientId, projectId } = await params

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Budget</h1>
        <p className="text-neutral-600 mt-1">
          Client: {clientId} • Project: {projectId}
        </p>
      </div>

      <BudgetTracker projectId={projectId} />
    </div>
  )
}


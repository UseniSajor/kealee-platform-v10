import { DocumentUpload } from "@pm/components/pm/projects/DocumentUpload"

export default async function ProjectDocumentsPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>
}) {
  const { clientId, projectId } = await params

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-neutral-600 mt-1">
          Client: {clientId} • Project: {projectId}
        </p>
      </div>

      <DocumentUpload projectId={projectId} />
    </div>
  )
}


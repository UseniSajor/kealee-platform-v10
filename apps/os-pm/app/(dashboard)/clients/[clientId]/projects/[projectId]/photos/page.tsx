import { PhotoGallery } from "@/components/projects/PhotoGallery"

export default async function ProjectPhotosPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>
}) {
  const { clientId, projectId } = await params

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Photos</h1>
        <p className="text-neutral-600 mt-1">
          Client: {clientId} • Project: {projectId}
        </p>
      </div>

      <PhotoGallery projectId={projectId} />
    </div>
  )
}


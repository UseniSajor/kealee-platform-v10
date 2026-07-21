import { notFound } from "next/navigation";
import { IntakeDetail } from "@kealee/ui/components/command-center/intake-detail";
import { ReviewWorkbench } from "@kealee/ui/components/command-center/review-workbench";
import { loadConceptOrderDetail } from "../_loader";

export const dynamic = "force-dynamic";

export default async function ConceptDetailPage({ params }: { params: { id: string } }) {
  const order = await loadConceptOrderDetail(params.id);

  if (!order) return notFound();

  const intake = (order.metadata as any)?.intakeData ?? {};
  const outputs = (order.metadata as any)?.outputs ?? {};

  const data = {
    status: order.deliveryStatus?.toUpperCase() ?? "PENDING",
    clientName: order.user?.name ?? order.user?.email ?? "Unknown",
    contactEmail: order.user?.email ?? "",
    projectAddress: intake.projectAddress ?? "",
    projectType: order.packageTier
      ? order.packageTier.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
      : "",
    budgetRange: intake.budgetRange ?? "",
    jurisdiction: intake.jurisdiction ?? "",
    uploadedPhotos: intake.photos ?? [],
    designBrief: outputs.designBrief ?? null,
    permitPathSummary: outputs.permitPathSummary ?? null,
    exteriorConceptImages: outputs.exteriorConceptImages ?? [],
    landscapeConceptImages: outputs.landscapeConceptImages ?? [],
    // Concept engine fields
    intakeId: order.id,
    projectPath: order.packageTier ?? 'interior_renovation',
  };

  const v30WorkspaceUrl = intake.v30WorkspaceUrl as string | undefined

  return (
    <div className="space-y-6 p-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Concept Review — {params.id}</h1>
        {intake.isV30 && v30WorkspaceUrl && (
          <a
            href={v30WorkspaceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-violet-600 hover:underline"
          >
            Open v30 workspace →
          </a>
        )}
      </div>
      {intake.isV30 && order.deliveryStatus === 'generating' && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          v30 parallel bots running — design syncs to this queue when DesignBot completes.
        </p>
      )}
      <IntakeDetail data={data} />
      {(data.exteriorConceptImages.length > 0 || data.landscapeConceptImages.length > 0) && (
        <ReviewWorkbench
          exteriorImages={data.exteriorConceptImages}
          landscapeImages={data.landscapeConceptImages}
        />
      )}
    </div>
  );
}

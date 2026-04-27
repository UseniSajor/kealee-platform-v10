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
    projectType: order.packageTier ?? "",
    budgetRange: intake.budgetRange ?? "",
    jurisdiction: intake.jurisdiction ?? "",
    uploadedPhotos: intake.photos ?? [],
    designBrief: outputs.designBrief ?? null,
    permitPathSummary: outputs.permitPathSummary ?? null,
    exteriorConceptImages: outputs.exteriorConceptImages ?? [],
    landscapeConceptImages: outputs.landscapeConceptImages ?? [],
  };

  return (
    <div className="space-y-6 p-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Concept Review — {params.id}</h1>
      </div>
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

import { IntakeQueue } from "@kealee/ui/components/command-center/intake-queue";
import type { QueueItem } from "@kealee/ui/components/command-center/intake-queue";
import { loadConceptQueue } from "./_loader";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending:    "COLLECTING_INFO",
  generating: "GENERATING_VISUALS",
  ready:      "READY_FOR_PM_REVIEW",
  delivered:  "DELIVERED",
};

export default async function ConceptsPage() {
  const { orders, total } = await loadConceptQueue({ limit: 50 });

  const items: QueueItem[] = orders.length
    ? orders.map((o) => ({
        id: o.id,
        client: o.user?.name ?? o.user?.email ?? "Unknown",
        address:
          (o.metadata as any)?.intakeData?.projectAddress ?? "Address not provided",
        projectType: o.packageTier,
        status: STATUS_LABEL[o.deliveryStatus] ?? o.deliveryStatus.toUpperCase(),
        complexity:
          (o.metadata as any)?.leadScore?.tier === "hot"
            ? "high"
            : (o.metadata as any)?.leadScore?.tier === "warm"
            ? "medium"
            : "low",
      }))
    : [];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exterior Concept Intake</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total > 0 ? `${total} active order${total !== 1 ? "s" : ""} in queue` : "Manage and review incoming exterior concept requests"}
          </p>
        </div>
      </div>
      <IntakeQueue items={items} />
    </div>
  );
}

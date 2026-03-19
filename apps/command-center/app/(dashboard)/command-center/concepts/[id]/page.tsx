import { IntakeDetail } from "@kealee/ui/components/command-center/intake-detail";
import { ReviewWorkbench } from "@kealee/ui/components/command-center/review-workbench";

const mock = {
  status: "READY_FOR_PM_REVIEW",
  clientName: "Tim Chamberlain",
  contactEmail: "tim@example.com",
  projectAddress: "123 Example St, Fort Washington, MD",
  projectType: "facade redesign",
  budgetRange: "$15,000–$35,000",
  jurisdiction: "Prince George's County, MD",
  uploadedPhotos: [
    "https://dummy.kealee.local/front.jpg",
    "https://dummy.kealee.local/rear.jpg",
    "https://dummy.kealee.local/side.jpg",
  ],
  designBrief: {
    summary:
      "Refresh curb appeal with modern contrast details, upgraded entry emphasis, and cleaner planting composition.",
  },
  permitPathSummary: {
    notes: [
      "Preliminary path to approval only.",
      "Final zoning and permit scope should be confirmed during professional review.",
    ],
  },
  exteriorConceptImages: [
    "https://dummy.kealee.local/exterior-1.jpg",
    "https://dummy.kealee.local/exterior-2.jpg",
    "https://dummy.kealee.local/exterior-3.jpg",
  ],
  landscapeConceptImages: [
    "https://dummy.kealee.local/landscape-1.jpg",
    "https://dummy.kealee.local/landscape-2.jpg",
  ],
};

export default function ConceptDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6 p-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold">Concept Review — {params.id}</h1>
      </div>
      <IntakeDetail data={mock} />
      <ReviewWorkbench
        exteriorImages={mock.exteriorConceptImages}
        landscapeImages={mock.landscapeConceptImages}
      />
    </div>
  );
}

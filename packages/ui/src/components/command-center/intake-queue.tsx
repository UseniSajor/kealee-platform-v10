import Link from "next/link";
import { StatusBadge } from "./status-badge";

export type QueueItem = {
  id: string;
  client: string;
  address: string;
  projectType: string;
  status: string;
  complexity: string;
};

export function IntakeQueue({ items }: { items: QueueItem[] }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Exterior Concept Intake Queue</h2>
        <input
          className="rounded-xl border px-3 py-2 text-sm"
          placeholder="Search client or address"
        />
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/command-center/concepts/${item.id}`}
            className="block rounded-xl border p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-medium">{item.client}</div>
                <div className="text-sm text-slate-600">{item.address}</div>
                <div className="mt-1 text-sm text-slate-500">
                  {item.projectType} ·{" "}
                  <span className={`font-medium ${item.complexity === "high" ? "text-red-600" : item.complexity === "medium" ? "text-amber-600" : "text-green-600"}`}>
                    {item.complexity}
                  </span>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

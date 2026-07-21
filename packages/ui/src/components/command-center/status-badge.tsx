type Props = { status: string };

const colorMap: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-800",
  COLLECTING_INFO: "bg-yellow-100 text-yellow-800",
  WAITING_FOR_CLIENT: "bg-orange-100 text-orange-800",
  ANALYZING_SITE: "bg-blue-100 text-blue-800",
  GENERATING_BRIEF: "bg-indigo-100 text-indigo-800",
  GENERATING_VISUALS: "bg-purple-100 text-purple-800",
  READY_FOR_PM_REVIEW: "bg-emerald-100 text-emerald-800",
  NEEDS_REVISION: "bg-amber-100 text-amber-800",
  ESCALATED_MANUAL: "bg-red-100 text-red-800",
  APPROVED_FOR_DELIVERY: "bg-green-100 text-green-800",
  DELIVERED: "bg-green-200 text-green-900",
  CLOSED: "bg-slate-200 text-slate-900",
  FAILED: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ status }: Props) {
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${colorMap[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

import { cn } from "@pm/lib/utils"

export function Badge({ priority }: { priority: "low" | "medium" | "high" }) {
  const styles =
    priority === "high"
      ? "bg-red-50 text-red-700 border-red-200"
      : priority === "medium"
        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
        : "bg-green-50 text-green-700 border-green-200"

  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", styles)}>
      {priority}
    </span>
  )
}


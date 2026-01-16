import { redirect } from "next/navigation"

export default async function LegacyTaskRoute({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params
  redirect(`/work-queue/${taskId}`)
}


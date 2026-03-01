export default function DashboardLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-sky-600 border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  )
}

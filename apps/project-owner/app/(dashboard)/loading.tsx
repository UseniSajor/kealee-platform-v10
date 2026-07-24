export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#2ABFBF', borderTopColor: 'transparent' }} />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

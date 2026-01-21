export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Finance & Trust Hub</h1>
        <p className="text-lg mb-8">Stage 5 - Weeks 12-14</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border p-4 rounded">
            <h2 className="font-semibold mb-2">Escrow Accounts</h2>
            <p className="text-sm text-gray-600">Manage escrow accounts and deposits</p>
          </div>
          <div className="border p-4 rounded">
            <h2 className="font-semibold mb-2">Payment Releases</h2>
            <p className="text-sm text-gray-600">Process milestone payments</p>
          </div>
          <div className="border p-4 rounded">
            <h2 className="font-semibold mb-2">Financial Reporting</h2>
            <p className="text-sm text-gray-600">View reports and analytics</p>
          </div>
        </div>
      </div>
    </main>
  )
}


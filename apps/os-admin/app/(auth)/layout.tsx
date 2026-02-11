export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">Kealee</span>
          </div>
          <p className="text-slate-400 text-sm">Admin Console</p>
        </div>
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Manage your platform<br />with confidence.
          </h2>
          <p className="text-slate-300 text-lg max-w-md">
            Monitor projects, manage users, and oversee operations from a single dashboard.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-2xl font-bold text-white">15+</div>
              <div className="text-slate-400 text-sm">Mini Apps</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Real-time</div>
              <div className="text-slate-400 text-sm">Analytics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-slate-400 text-sm">Monitoring</div>
            </div>
          </div>
        </div>
        <div className="relative z-10 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Kealee. All rights reserved.
        </div>
      </div>

      {/* Right login panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

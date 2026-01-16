export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600">
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}


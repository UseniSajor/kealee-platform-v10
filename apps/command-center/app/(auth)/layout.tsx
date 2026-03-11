export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0F1A2E 0%, #1A2B4A 50%, #0F1A2E 100%)' }}>
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

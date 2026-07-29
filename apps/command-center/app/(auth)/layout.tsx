export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F7 50%, #F8FAFC 100%)' }}>
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}

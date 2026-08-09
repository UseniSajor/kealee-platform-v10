import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-50 px-4">
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-orange-500 hover:bg-orange-600',
              card: 'bg-white shadow-lg',
            },
          }}
        />
      </div>
    </div>
  )
}

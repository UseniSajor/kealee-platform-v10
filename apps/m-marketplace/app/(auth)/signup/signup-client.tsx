"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@kealee/ui/button"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { signUp } from "@kealee/auth/client"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"

const MARKETPLACE_ROLES = [
  { value: "contractor", label: "Contractor" },
  { value: "vendor", label: "Vendor" },
]

type FieldErrors = Partial<Record<string, string>>

export function SignupClient() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!firstName.trim()) errs.firstName = "First name is required"
    if (!lastName.trim()) errs.lastName = "Last name is required"
    if (!email.trim()) errs.email = "Email is required"
    if (!selectedRole) errs.role = "Please select your role"
    if (!companyName.trim()) errs.companyName = "Company name is required"
    if (password.length < 8) errs.password = "Password must be at least 8 characters"
    if (password !== confirmPassword) errs.confirmPassword = "Passwords do not match"
    return errs
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0] || "Please fix the errors below")
      return
    }
    setLoading(true)
    setError("")

    try {
      // Store email for the verify-email resend button
      sessionStorage.setItem('kealee:signup-email', email)

      const data = await signUp(email, password, {
        firstName,
        lastName,
        role: selectedRole,
        companyName,
      })

      // If Supabase email confirmation is enabled, the user object will exist
      // but the session will be null until they verify. Redirect to verify-email page.
      if (data.session) {
        // Auto-confirmed (e.g. email confirmation disabled) — go to home
        router.push("/")
        router.refresh()
      } else {
        // Email confirmation required — show verification instructions
        router.push("/auth/verify-email")
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up")
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    setError("")
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/auth/callback",
        },
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up with Google")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <img
          src="/kealee-logo-600w.png"
          alt="Kealee"
          className="h-28 w-auto mx-auto mb-2"
        />
        <CardTitle className="text-2xl text-center">Join the Marketplace</CardTitle>
        <p className="text-sm text-neutral-600 text-center">
          Create your account to start connecting with clients
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (fieldErrors.firstName) setFieldErrors((p) => ({ ...p, firstName: undefined }))
                }}
                placeholder="First name"
                required
                minLength={1}
                aria-invalid={!!fieldErrors.firstName}
                aria-describedby={fieldErrors.firstName ? "firstName-error" : undefined}
              />
              {fieldErrors.firstName && (
                <p id="firstName-error" className="text-xs text-red-600" role="alert">{fieldErrors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  if (fieldErrors.lastName) setFieldErrors((p) => ({ ...p, lastName: undefined }))
                }}
                placeholder="Last name"
                required
                minLength={1}
                aria-invalid={!!fieldErrors.lastName}
                aria-describedby={fieldErrors.lastName ? "lastName-error" : undefined}
              />
              {fieldErrors.lastName && (
                <p id="lastName-error" className="text-xs text-red-600" role="alert">{fieldErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }))
              }}
              placeholder="you@company.com"
              required
              autoComplete="email"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-xs text-red-600" role="alert">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">I am a...</Label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value)
                if (fieldErrors.role) setFieldErrors((p) => ({ ...p, role: undefined }))
              }}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${fieldErrors.role ? "border-red-500" : "border-input"}`}
              required
              aria-invalid={!!fieldErrors.role}
              aria-describedby={fieldErrors.role ? "role-error" : undefined}
            >
              <option value="">Select your role</option>
              {MARKETPLACE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            {fieldErrors.role && (
              <p id="role-error" className="text-xs text-red-600" role="alert">{fieldErrors.role}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value)
                if (fieldErrors.companyName) setFieldErrors((p) => ({ ...p, companyName: undefined }))
              }}
              placeholder="Your company name"
              required
              minLength={2}
              aria-invalid={!!fieldErrors.companyName}
              aria-describedby={fieldErrors.companyName ? "companyName-error" : undefined}
            />
            {fieldErrors.companyName && (
              <p id="companyName-error" className="text-xs text-red-600" role="alert">{fieldErrors.companyName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }))
              }}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
            />
            <p id="password-hint" className="text-xs text-neutral-500">Must be at least 8 characters</p>
            {fieldErrors.password && (
              <p id="password-error" className="text-xs text-red-600" role="alert">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: undefined }))
              }}
              placeholder="Confirm your password"
              required
              minLength={8}
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
            />
            {fieldErrors.confirmPassword && (
              <p id="confirmPassword-error" className="text-xs text-red-600" role="alert">{fieldErrors.confirmPassword}</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm" role="alert">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">Or sign up with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignup}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign up with Google
          </Button>

          <p className="text-sm text-neutral-600 text-center">
            Already have an account?{" "}
            <Link className="text-primary hover:underline" href="/login">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@kealee/ui/button"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { signUp } from "@kealee/auth/client"
import Link from "next/link"

type FieldErrors = Partial<Record<string, string>>

export function SignupClient() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  function validate(): FieldErrors {
    const errs: FieldErrors = {}
    if (!firstName.trim()) errs.firstName = "First name is required"
    if (!lastName.trim()) errs.lastName = "Last name is required"
    if (!email.trim()) errs.email = "Email is required"
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
        role: "admin",
      })

      // If Supabase email confirmation is enabled, the user object will exist
      // but the session will be null until they verify. Redirect to verify-email page.
      if (data.session) {
        // Auto-confirmed (e.g. email confirmation disabled) — go to dashboard
        router.push("/dashboard")
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Admin Sign Up</CardTitle>
        <p className="text-sm text-neutral-600 text-center">
          Create an admin account for the Kealee Platform
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignup} className="space-y-4" noValidate>
          <div className="bg-amber-50 text-amber-700 p-3 rounded text-sm" role="status">
            Admin accounts require approval before full access is granted.
          </div>

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
              placeholder="admin@kealee.com"
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
            {loading ? "Creating account..." : "Create Admin Account"}
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

"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@kealee/ui/button"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { signIn } from "@kealee/auth/client"
import { HardHat } from "lucide-react"

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const unauthorized = searchParams.get("error") === "unauthorized"
  const redirect = searchParams.get("redirect") || "/"

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await signIn(email, password)
      router.refresh()
      router.push(redirect)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4">
            <HardHat className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">Kealee PM</h1>
          <p className="text-sm text-neutral-500 mt-1">Construction Project Management Software</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Sign In</CardTitle>
            <p className="text-sm text-neutral-600 text-center">
              Access your projects, schedules, and team tools
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {unauthorized && !error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  Your account does not have access to this application. Please contact your administrator.
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <p className="text-sm text-neutral-600 text-center">
                New to Kealee PM?{" "}
                <Link className="text-primary hover:underline font-medium" href="/signup">
                  Start free trial
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Pricing tiers hint */}
        <div className="text-center text-xs text-neutral-400 space-y-1">
          <p>Plans from $99/mo | Schedule, Budget, RFIs, Submittals & more</p>
          <p>Used by GCs, builders, and contractors across the DC-Baltimore corridor</p>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@kealee/ui/button"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const unauthorized = searchParams.get("error") === "unauthorized"

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      if (data.session) {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">PM Dashboard Login</CardTitle>
        <p className="text-sm text-neutral-600 text-center">
          Sign in to access your PM workspace
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {unauthorized && !error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
              Unauthorized: PM access only
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="christine@kealee.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="space-y-2">
            <p className="text-xs text-neutral-600 text-center">
              Sign in with your Kealee account credentials.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

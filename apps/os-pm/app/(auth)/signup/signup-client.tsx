"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@kealee/ui/button"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { signUp } from "@kealee/auth/client"
import { Check, HardHat } from "lucide-react"
import { cn } from "@/lib/utils"

const TIERS = [
  {
    id: "essentials",
    name: "Essentials",
    price: "$99",
    features: ["Up to 5 projects", "Tasks & documents", "Daily logs & photos", "Team management", "Basic reports"],
  },
  {
    id: "performance",
    name: "Performance",
    price: "$199",
    popular: true,
    features: ["Up to 10 projects", "Everything in Essentials", "Schedule & Gantt", "Budget tracking", "RFIs & submittals", "Change orders", "Punch lists & bids"],
  },
  {
    id: "scale",
    name: "Scale",
    price: "$349",
    features: ["Up to 20 projects", "Everything in Performance", "Safety management", "Drawings & markup", "Selections & allowances", "Meeting minutes", "Advanced analytics"],
  },
]

export function SignupClient() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedTier, setSelectedTier] = useState("performance")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [trade, setTrade] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      await signUp(email, password, {
        firstName,
        lastName,
        companyName,
        trade,
        role: "gc",
        subscriptionTier: selectedTier,
      })

      router.push("/dashboard")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <img
            src="/kealee-logo.png"
            alt="Kealee Construction"
            className="h-12 w-auto mx-auto mb-3"
          />
          <h1 className="text-2xl font-bold text-neutral-900">Start Your Free Trial</h1>
          <p className="text-sm text-neutral-500 mt-1">14-day free trial. No credit card required.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <div className={cn("flex items-center gap-2", step >= 1 ? "text-blue-600 font-medium" : "text-neutral-400")}>
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs", step >= 1 ? "bg-blue-600 text-white" : "bg-neutral-200")}>1</div>
            Plan
          </div>
          <div className="w-8 h-px bg-neutral-300" />
          <div className={cn("flex items-center gap-2", step >= 2 ? "text-blue-600 font-medium" : "text-neutral-400")}>
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs", step >= 2 ? "bg-blue-600 text-white" : "bg-neutral-200")}>2</div>
            Account
          </div>
        </div>

        {/* Step 1: Choose Plan */}
        {step === 1 && (
          <div className="grid md:grid-cols-3 gap-4">
            {TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={cn(
                  "cursor-pointer transition-all",
                  selectedTier === tier.id ? "ring-2 ring-blue-600 shadow-lg" : "hover:shadow-md",
                  tier.popular && "relative"
                )}
                onClick={() => setSelectedTier(tier.id)}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{tier.name}</CardTitle>
                  <div className="text-3xl font-bold text-neutral-900">
                    {tier.price}<span className="text-sm font-normal text-neutral-500">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="text-center">
            <Button size="lg" onClick={() => setStep(2)}>
              Continue with {TIERS.find((t) => t.id === selectedTier)?.name}
            </Button>
            <p className="mt-3 text-xs text-neutral-400">
              Need Enterprise (unlimited projects)?{" "}
              <a href="https://kealee.com/contact" className="text-primary hover:underline">Contact sales</a>
            </p>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-xl text-center">Create Your Account</CardTitle>
              <p className="text-sm text-neutral-600 text-center">
                {TIERS.find((t) => t.id === selectedTier)?.name} plan &mdash; {TIERS.find((t) => t.id === selectedTier)?.price}/mo
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Your construction company" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trade">Primary Trade / Role</Label>
                  <select
                    id="trade"
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select your role...</option>
                    <option value="gc">General Contractor</option>
                    <option value="builder">Builder / Developer</option>
                    <option value="contractor">Specialty Contractor</option>
                    <option value="architect">Architect</option>
                    <option value="engineer">Engineer</option>
                    <option value="owner">Project Owner</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" required />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Start Free Trial"}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => setStep(1)} className="text-primary hover:underline">
                    Change plan
                  </button>
                  <p className="text-neutral-600">
                    Already have an account?{" "}
                    <Link className="text-primary hover:underline" href="/login">Sign in</Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

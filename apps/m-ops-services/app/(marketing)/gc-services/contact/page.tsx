"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { gcIntakeSchema, type GCIntakeFormData } from "@/lib/validations/gc-intake"
import {
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  Label,
  Select,
  Checkbox,
} from "@/components/ui"
import { Loader2, CheckCircle2, AlertCircle, Mail, Phone, Clock } from "lucide-react"

export default function GCContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [pageLoadTime] = useState(Date.now())

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<GCIntakeFormData>({
    resolver: zodResolver(gcIntakeSchema),
    defaultValues: {
      challenges: [],
      consent: false,
      website: '',
    },
  })

  const selectedChallenges = watch("challenges") || []

  const challengeOptions = [
    "Permit delays",
    "Inspection coordination",
    "Vendor/sub coordination",
    "Client reporting",
    "Document organization",
    "Schedule management",
    "Admin time drain",
    "Growing too fast",
  ]

  const handleChallengeToggle = (challenge: string) => {
    const current = selectedChallenges
    const updated = current.includes(challenge)
      ? current.filter((c) => c !== challenge)
      : [...current, challenge]
    setValue("challenges", updated)
  }

  const onSubmit = async (data: GCIntakeFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch("/api/gc-ops-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          submittedAt: pageLoadTime,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage(result.message || 'Thank you! We will be in touch within 24 hours to start your free trial.')
        reset()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setSubmitStatus('error')
        setSubmitMessage(result.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('Network error. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Start Your Free 14-Day Trial
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Tell us about your business and we'll get you set up with operations support this week. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              {submitStatus === 'success' ? (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-8 pb-8 text-center">
                    <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Thanks for Signing Up!
                    </h2>
                    <p className="text-gray-700 mb-6">{submitMessage}</p>
                    <Button
                      onClick={() => setSubmitStatus('idle')}
                      variant="outline"
                      className="border-2 border-gray-300 hover:border-blue-600"
                    >
                      Submit Another Request
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-8 pb-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      {/* Contact Info */}
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Contact Information
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input id="fullName" {...register("fullName")} placeholder="John Smith" />
                            {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>}
                          </div>

                          <div>
                            <Label htmlFor="company">Company Name *</Label>
                            <Input id="company" {...register("company")} placeholder="Smith Construction" />
                            {errors.company && <p className="text-sm text-red-600 mt-1">{errors.company.message}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input id="email" type="email" {...register("email")} placeholder="john@smithconstruction.com" />
                            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
                          </div>

                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" type="tel" {...register("phone")} placeholder="(555) 123-4567" />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="role">Your Role *</Label>
                          <Select id="role" {...register("role")}>
                            <option value="">Select your role</option>
                            <option value="Owner">Owner</option>
                            <option value="Project Manager">Project Manager</option>
                            <option value="Operations Manager">Operations Manager</option>
                            <option value="Foreman">Foreman</option>
                            <option value="Other">Other</option>
                          </Select>
                          {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>}
                        </div>

                        <input type="text" {...register("website")} style={{ position: 'absolute', left: '-9999px' }} tabIndex={-1} autoComplete="off" />
                      </div>

                      {/* Business Details */}
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Business Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="gcType">GC Type *</Label>
                            <Select id="gcType" {...register("gcType")}>
                              <option value="">Select type</option>
                              <option value="Residential GC">Residential GC</option>
                              <option value="Commercial GC">Commercial GC</option>
                              <option value="Multi-Family">Multi-Family</option>
                              <option value="Remodeling">Remodeling</option>
                              <option value="Mixed-Use">Mixed-Use</option>
                              <option value="Specialty">Specialty</option>
                            </Select>
                            {errors.gcType && <p className="text-sm text-red-600 mt-1">{errors.gcType.message}</p>}
                          </div>

                          <div>
                            <Label htmlFor="teamSize">Team Size *</Label>
                            <Select id="teamSize" {...register("teamSize")}>
                              <option value="">Select size</option>
                              <option value="Solo (just me)">Solo (just me)</option>
                              <option value="2-5 people">2-5 people</option>
                              <option value="6-15 people">6-15 people</option>
                              <option value="16-30 people">16-30 people</option>
                              <option value="30+ people">30+ people</option>
                            </Select>
                            {errors.teamSize && <p className="text-sm text-red-600 mt-1">{errors.teamSize.message}</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="projectsPerYear">Projects Per Year *</Label>
                            <Select id="projectsPerYear" {...register("projectsPerYear")}>
                              <option value="">Select range</option>
                              <option value="1-5 projects">1-5 projects</option>
                              <option value="6-15 projects">6-15 projects</option>
                              <option value="16-30 projects">16-30 projects</option>
                              <option value="30+ projects">30+ projects</option>
                            </Select>
                            {errors.projectsPerYear && <p className="text-sm text-red-600 mt-1">{errors.projectsPerYear.message}</p>}
                          </div>

                          <div>
                            <Label htmlFor="averageProjectValue">Average Project Value *</Label>
                            <Select id="averageProjectValue" {...register("averageProjectValue")}>
                              <option value="">Select range</option>
                              <option value="< $250K">{"< $250K"}</option>
                              <option value="$250K-$1M">$250K-$1M</option>
                              <option value="$1M-$5M">$1M-$5M</option>
                              <option value="$5M-$15M">$5M-$15M</option>
                              <option value="$15M+">$15M+</option>
                            </Select>
                            {errors.averageProjectValue && <p className="text-sm text-red-600 mt-1">{errors.averageProjectValue.message}</p>}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="serviceArea">Service Area (Cities/Regions) *</Label>
                          <Input id="serviceArea" {...register("serviceArea")} placeholder="Austin, Round Rock, Georgetown" />
                          {errors.serviceArea && <p className="text-sm text-red-600 mt-1">{errors.serviceArea.message}</p>}
                        </div>
                      </div>

                      {/* Challenges */}
                      <div className="space-y-3">
                        <Label>What are your biggest challenges? (Select all that apply) *</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {challengeOptions.map((challenge) => (
                            <div key={challenge} className="flex items-center space-x-2">
                              <Checkbox
                                id={`challenge-${challenge}`}
                                checked={selectedChallenges.includes(challenge)}
                                onChange={() => handleChallengeToggle(challenge)}
                              />
                              <Label htmlFor={`challenge-${challenge}`} className="cursor-pointer text-sm">
                                {challenge}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {errors.challenges && <p className="text-sm text-red-600">{errors.challenges.message}</p>}
                      </div>

                      {/* Package Interest */}
                      <div>
                        <Label htmlFor="packageInterest">Package Interest *</Label>
                        <Select id="packageInterest" {...register("packageInterest")}>
                          <option value="">Select package</option>
                          <option value="Package A - Solo GC ($1,750/mo)">Package A - Solo GC ($1,750/mo)</option>
                          <option value="Package B - Growing Team ($3,750/mo)">Package B - Growing Team ($3,750/mo)</option>
                          <option value="Package C - Multiple Projects ($9,500/mo)">Package C - Multiple Projects ($9,500/mo)</option>
                          <option value="Package D - Enterprise GC ($16,500/mo)">Package D - Enterprise GC ($16,500/mo)</option>
                          <option value="Not sure - need consultation">Not sure - need consultation</option>
                        </Select>
                        {errors.packageInterest && <p className="text-sm text-red-600 mt-1">{errors.packageInterest.message}</p>}
                      </div>

                      {/* Message */}
                      <div>
                        <Label htmlFor="message">Tell Us About Your Needs *</Label>
                        <Textarea
                          id="message"
                          {...register("message")}
                          rows={4}
                          placeholder="What operations tasks are taking up most of your time? What would help you most right now?"
                        />
                        {errors.message && <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>}
                      </div>

                      {/* Consent */}
                      <div className="flex items-start space-x-2">
                        <Checkbox id="consent" {...register("consent")} className="mt-0.5" />
                        <Label htmlFor="consent" className="cursor-pointer text-sm leading-relaxed">
                          I agree to start a 14-day free trial and understand I can cancel anytime. No credit card required. *
                        </Label>
                      </div>
                      {errors.consent && <p className="text-sm text-red-600">{errors.consent.message}</p>}

                      {submitStatus === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">{submitMessage}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 text-base font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          "Start Free Trial"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Mail className="h-5 w-5 text-blue-600 mr-2" />
                    Contact Information
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <a href="mailto:getstarted@kealee.com" className="text-blue-600 hover:underline">
                        getstarted@kealee.com
                      </a>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Phone</p>
                      <a href="tel:+13015758777" className="text-blue-600 hover:underline">
                        (301) 575-8777
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    What Happens Next
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-gray-900">1. Quick Call (15 min)</p>
                      <p>We will call within 24 hours to understand your needs.</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">2. Onboarding (Week 1)</p>
                      <p>We learn your systems and start handling operations.</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">3. Free Trial Begins</p>
                      <p>14 days of full service—no credit card, no commitment.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    14-Day Free Trial
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>No credit card required</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Full access to all features</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>Cancel anytime</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

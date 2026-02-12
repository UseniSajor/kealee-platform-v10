"use client"

import { useState } from "react"
import Image from "next/image"
import { Metadata } from "next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { intakeSchema, type IntakeFormData } from "@/lib/validations/intake"
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
import { Loader2, CheckCircle2, AlertCircle, Mail, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
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
  } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      notUnitBased: false,
      needsHelp: [],
      consent: false,
      website: '', // Honeypot
    },
  })

  const notUnitBased = watch("notUnitBased")
  const selectedNeeds = watch("needsHelp") || []

  const needsOptions = [
    "Feasibility",
    "Entitlements",
    "Budget/Schedule",
    "GC procurement",
    "Change orders",
    "Pay apps",
    "Close-out",
    "Rescue",
  ]

  const handleNeedToggle = (need: string) => {
    const current = selectedNeeds
    const updated = current.includes(need)
      ? current.filter((n) => n !== need)
      : [...current, need]
    setValue("needsHelp", updated)
  }

  const onSubmit = async (data: IntakeFormData) => {
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          submittedAt: pageLoadTime,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage(result.message || 'Thank you! We will be in touch within 24 hours.')
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
      <section className="relative py-16 lg:py-20">
        <Image src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1920&q=80&auto=format&fit=crop" alt="Team meeting" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Request a Project Review
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Tell us about your project and we'll provide a complimentary assessment with a clear scope and fee proposal within 48 hours.
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
                      Thank You!
                    </h2>
                    <p className="text-gray-700 mb-6">{submitMessage}</p>
                    <Button
                      onClick={() => setSubmitStatus('idle')}
                      variant="outline"
                      className="border-2 border-gray-300 hover:border-orange-600"
                    >
                      Submit Another Request
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white border-gray-200">
                  <CardContent className="pt-8 pb-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      {/* Contact Information */}
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Contact Information
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="fullName">Full Name *</Label>
                            <Input
                              id="fullName"
                              {...register("fullName")}
                              placeholder="John Smith"
                            />
                            {errors.fullName && (
                              <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="company">Company / Organization *</Label>
                            <Input
                              id="company"
                              {...register("company")}
                              placeholder="ABC Development"
                            />
                            {errors.company && (
                              <p className="text-sm text-red-600 mt-1">{errors.company.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="email">Email *</Label>
                            <Input
                              id="email"
                              type="email"
                              {...register("email")}
                              placeholder="john@example.com"
                            />
                            {errors.email && (
                              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              type="tel"
                              {...register("phone")}
                              placeholder="(555) 123-4567"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="role">Your Role *</Label>
                          <Select id="role" {...register("role")}>
                            <option value="">Select your role</option>
                            <option value="Owner">Owner</option>
                            <option value="Developer">Developer</option>
                            <option value="Investor">Investor</option>
                            <option value="Asset Manager">Asset Manager</option>
                            <option value="Non-profit">Non-profit</option>
                            <option value="Other">Other</option>
                          </Select>
                          {errors.role && (
                            <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
                          )}
                        </div>

                        {/* Honeypot field */}
                        <input
                          type="text"
                          {...register("website")}
                          style={{ position: 'absolute', left: '-9999px' }}
                          tabIndex={-1}
                          autoComplete="off"
                        />
                      </div>

                      {/* Project Details */}
                      <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                          Project Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="location">Location (City, State) *</Label>
                            <Input
                              id="location"
                              {...register("location")}
                              placeholder="Austin, TX"
                            />
                            {errors.location && (
                              <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="assetType">Asset Type *</Label>
                            <Select id="assetType" {...register("assetType")}>
                              <option value="">Select asset type</option>
                              <option value="Multifamily">Multifamily</option>
                              <option value="Mixed-use">Mixed-use</option>
                              <option value="Townhomes">Townhomes</option>
                              <option value="SFD">SFD</option>
                              <option value="Commercial">Commercial</option>
                              <option value="Industrial">Industrial</option>
                              <option value="Other">Other</option>
                            </Select>
                            {errors.assetType && (
                              <p className="text-sm text-red-600 mt-1">{errors.assetType.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Checkbox
                              id="notUnitBased"
                              {...register("notUnitBased")}
                            />
                            <Label htmlFor="notUnitBased" className="cursor-pointer">
                              Not unit-based project
                            </Label>
                          </div>
                          <Label htmlFor="units">
                            {notUnitBased ? "Project Size" : "Number of Units (minimum 10)"} *
                          </Label>
                          <Input
                            id="units"
                            {...register("units")}
                            placeholder={notUnitBased ? "N/A or describe scope" : "10"}
                          />
                          {errors.units && (
                            <p className="text-sm text-red-600 mt-1">{errors.units.message}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="projectStage">Project Stage *</Label>
                            <Select id="projectStage" {...register("projectStage")}>
                              <option value="">Select stage</option>
                              <option value="Pre-acquisition">Pre-acquisition</option>
                              <option value="Under contract">Under contract</option>
                              <option value="Design">Design</option>
                              <option value="Permitting">Permitting</option>
                              <option value="Bidding">Bidding</option>
                              <option value="In construction">In construction</option>
                              <option value="Stalled/Rescue">Stalled/Rescue</option>
                            </Select>
                            {errors.projectStage && (
                              <p className="text-sm text-red-600 mt-1">{errors.projectStage.message}</p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="budgetRange">Budget Range *</Label>
                            <Select id="budgetRange" {...register("budgetRange")}>
                              <option value="">Select budget range</option>
                              <option value="< $1M">{"< $1M"}</option>
                              <option value="$1–5M">$1–5M</option>
                              <option value="$5–15M">$5–15M</option>
                              <option value="$15–50M">$15–50M</option>
                              <option value="$50M+">$50M+</option>
                            </Select>
                            {errors.budgetRange && (
                              <p className="text-sm text-red-600 mt-1">{errors.budgetRange.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="timeline">Timeline to Decision *</Label>
                          <Select id="timeline" {...register("timeline")}>
                            <option value="">Select timeline</option>
                            <option value="0–3 mo">0–3 months</option>
                            <option value="3–6 mo">3–6 months</option>
                            <option value="6–12 mo">6–12 months</option>
                            <option value="12+ mo">12+ months</option>
                          </Select>
                          {errors.timeline && (
                            <p className="text-sm text-red-600 mt-1">{errors.timeline.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Areas of Need */}
                      <div className="space-y-3">
                        <Label>What do you need help with? (Select all that apply) *</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {needsOptions.map((need) => (
                            <div key={need} className="flex items-center space-x-2">
                              <Checkbox
                                id={`need-${need}`}
                                checked={selectedNeeds.includes(need)}
                                onChange={() => handleNeedToggle(need)}
                              />
                              <Label htmlFor={`need-${need}`} className="cursor-pointer text-sm">
                                {need}
                              </Label>
                            </div>
                          ))}
                        </div>
                        {errors.needsHelp && (
                          <p className="text-sm text-red-600">{errors.needsHelp.message}</p>
                        )}
                      </div>

                      {/* Project Summary */}
                      <div>
                        <Label htmlFor="message">Project Summary *</Label>
                        <Textarea
                          id="message"
                          {...register("message")}
                          rows={5}
                          placeholder="Tell us about your project, challenges, and what you're looking to achieve..."
                        />
                        {errors.message && (
                          <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
                        )}
                      </div>

                      {/* Attachments Note */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
                        <p className="font-medium text-gray-900 mb-1">Need to share documents?</p>
                        <p>After submitting this form, you can email plans, budgets, or other documents to{" "}
                          <a href="mailto:getstarted@kealee.com" className="text-orange-600 hover:underline">
                            getstarted@kealee.com
                          </a>
                        </p>
                      </div>

                      {/* Consent */}
                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="consent"
                          {...register("consent")}
                          className="mt-0.5"
                        />
                        <Label htmlFor="consent" className="cursor-pointer text-sm leading-relaxed">
                          I understand Kealee Development provides advisory services and provides licensed design and or legal counsel when required. *
                        </Label>
                      </div>
                      {errors.consent && (
                        <p className="text-sm text-red-600">{errors.consent.message}</p>
                      )}

                      {/* Submit Status */}
                      {submitStatus === 'error' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-800">{submitMessage}</p>
                        </div>
                      )}

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl h-12 text-base font-semibold"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Project Review Request"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Mail className="h-5 w-5 text-orange-600 mr-2" />
                    Contact Information
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-gray-900">Email</p>
                      <a href="mailto:getstarted@kealee.com" className="text-orange-600 hover:underline">
                        getstarted@kealee.com
                      </a>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Service Area
                      </p>
                      <p>Nationwide</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="h-5 w-5 text-orange-600 mr-2" />
                    What to Expect
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div>
                      <p className="font-medium text-gray-900">24-Hour Response</p>
                      <p>We'll acknowledge your request within one business day.</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">48-Hour Proposal</p>
                      <p>You'll receive a clear scope and fee proposal within 48 hours.</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">No Obligation</p>
                      <p>The initial review is complimentary with no commitment required.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Prefer to Talk First?
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    Email us directly and we'll schedule a brief call to discuss your project.
                  </p>
                  <a
                    href="mailto:getstarted@kealee.com"
                    className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Email Us Directly
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

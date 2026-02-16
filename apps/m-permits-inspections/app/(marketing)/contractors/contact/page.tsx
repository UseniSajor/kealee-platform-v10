"use client"

import { useState } from "react"
import Image from "next/image"
import { CheckCircle2, AlertCircle, Loader2, Mail, Phone, Clock } from "lucide-react"

export default function PermitContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    role: "",
    contractorType: "",
    yearsInBusiness: "",
    jurisdictions: [] as string[],
    permitsPerMonth: "",
    servicesNeeded: [] as string[],
    urgency: "",
    message: "",
    consent: false,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')

  const serviceOptions = [
    "Permit applications",
    "AI compliance review",
    "Inspection coordination",
    "Resubmittal management",
    "Expedited processing",
    "Multi-jurisdiction support",
  ]

  const jurisdictionOptions = [
    "Austin, TX",
    "Dallas, TX",
    "Houston, TX",
    "San Antonio, TX",
    "Other (specify in message)",
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/permit-service-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, submittedAt: Date.now() }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setSubmitMessage("Thank you! We'll contact you within 24 hours to get started.")
        setFormData({
          fullName: "",
          company: "",
          email: "",
          phone: "",
          role: "",
          contractorType: "",
          yearsInBusiness: "",
          jurisdictions: [],
          permitsPerMonth: "",
          servicesNeeded: [],
          urgency: "",
          message: "",
          consent: false,
        })
      } else {
        setSubmitStatus('error')
        setSubmitMessage('Something went wrong. Please try again.')
      }
    } catch (error) {
      setSubmitStatus('error')
      setSubmitMessage('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-20 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1920&q=80&auto=format&fit=crop"
          alt="Professional team collaborating"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Get Started with Permit Services
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed">
              Submit your first permit free. We will review it, submit it, and track it through approval.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {submitStatus === 'success' ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received!</h2>
                  <p className="text-gray-700">{submitMessage}</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Company *</label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Email *</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Your Role *</label>
                        <select
                          value={formData.role}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                          required
                        >
                          <option value="">Select role</option>
                          <option value="Owner">Owner</option>
                          <option value="Project Manager">Project Manager</option>
                          <option value="Foreman">Foreman</option>
                          <option value="Estimator">Estimator</option>
                          <option value="Developer">Developer</option>
                          <option value="Property Owner">Property Owner</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Contractor Type *</label>
                        <select
                          value={formData.contractorType}
                          onChange={(e) => setFormData({ ...formData, contractorType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                          required
                        >
                          <option value="">Select type</option>
                          <option value="General Contractor">General Contractor</option>
                          <option value="Electrical Contractor">Electrical Contractor</option>
                          <option value="Plumbing Contractor">Plumbing Contractor</option>
                          <option value="HVAC Contractor">HVAC Contractor</option>
                          <option value="Framing Contractor">Framing Contractor</option>
                          <option value="Roofing Contractor">Roofing Contractor</option>
                          <option value="Developer">Developer</option>
                          <option value="Property Owner">Property Owner</option>
                          <option value="Homeowner">Homeowner</option>
                          <option value="Other Specialty">Other Specialty</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Years in Business *</label>
                        <select
                          value={formData.yearsInBusiness}
                          onChange={(e) => setFormData({ ...formData, yearsInBusiness: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                          required
                        >
                          <option value="">Select range</option>
                          <option value="< 1 year">Less than 1 year</option>
                          <option value="1-3 years">1-3 years</option>
                          <option value="3-10 years">3-10 years</option>
                          <option value="10-20 years">10-20 years</option>
                          <option value="20+ years">20+ years</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-2">Permits Per Month *</label>
                        <select
                          value={formData.permitsPerMonth}
                          onChange={(e) => setFormData({ ...formData, permitsPerMonth: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                          required
                        >
                          <option value="">Select range</option>
                          <option value="1-5 permits">1-5 permits</option>
                          <option value="6-15 permits">6-15 permits</option>
                          <option value="16-30 permits">16-30 permits</option>
                          <option value="30+ permits">30+ permits</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Jurisdictions *</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {jurisdictionOptions.map((jurisdiction) => (
                          <label key={jurisdiction} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.jurisdictions.includes(jurisdiction)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...formData.jurisdictions, jurisdiction]
                                  : formData.jurisdictions.filter((j) => j !== jurisdiction)
                                setFormData({ ...formData, jurisdictions: updated })
                              }}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                            />
                            <span className="text-sm text-gray-700">{jurisdiction}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Urgency *</label>
                      <select
                        value={formData.urgency}
                        onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                        required
                      >
                        <option value="">How soon do you need help?</option>
                        <option value="No rush - planning ahead">No rush — planning ahead</option>
                        <option value="Need within 2 weeks">Need within 2 weeks</option>
                        <option value="Need within 1 week">Need within 1 week</option>
                        <option value="Urgent - ASAP">Urgent — ASAP</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">What services do you need? *</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {serviceOptions.map((service) => (
                          <label key={service} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.servicesNeeded.includes(service)}
                              onChange={(e) => {
                                const updated = e.target.checked
                                  ? [...formData.servicesNeeded, service]
                                  : formData.servicesNeeded.filter((s) => s !== service)
                                setFormData({ ...formData, servicesNeeded: updated })
                              }}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                            />
                            <span className="text-sm text-gray-700">{service}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Tell us about your permit needs *</label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                        placeholder="What type of permits do you need? Which jurisdictions? Any special requirements?"
                        required
                      />
                    </div>

                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.consent}
                        onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                        className="mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                        required
                      />
                      <label className="text-sm text-gray-700 leading-relaxed">
                        I agree to receive communication about permit services and understand I can unsubscribe anytime. *
                      </label>
                    </div>

                    {submitStatus === 'error' && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{submitMessage}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        "Get Started"
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Mail className="h-5 w-5 text-emerald-600 mr-2" />
                  Contact
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <a href="mailto:permits@kealee.com" className="text-emerald-600 hover:underline">
                      permits@kealee.com
                    </a>
                  </p>
                  <p>
                    <a href="tel:+13015758777" className="text-emerald-600 hover:underline">
                      (301) 575-8777
                    </a>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="h-5 w-5 text-emerald-600 mr-2" />
                  What Happens Next
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div>
                    <p className="font-medium">1. Quick Review (2 hours)</p>
                    <p className="text-gray-600">We review your submission and confirm details.</p>
                  </div>
                  <div>
                    <p className="font-medium">2. AI Compliance Check</p>
                    <p className="text-gray-600">Our AI reviews for code compliance issues.</p>
                  </div>
                  <div>
                    <p className="font-medium">3. Submit to Jurisdiction</p>
                    <p className="text-gray-600">We submit your complete application.</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">First Permit Free</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>No payment required</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Full service included</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>See our quality firsthand</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

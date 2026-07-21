import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Button, Card, CardContent, Badge } from "@/components/ui"
import {
  CheckCircle2,
  ArrowRight,
  Calendar,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  Shield,
  Clock,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Services - Operations Support for General Contractors | Kealee",
  description: "Complete operations department services for GCs: permit tracking, vendor coordination, weekly reporting, document management. From $1,750/month.",
}

export default function GCServicesPage() {
  const services = [
    {
      icon: Calendar,
      title: "Permit & Inspection Management",
      description: "We track every permit application, follow up with jurisdictions, schedule inspections, and ensure you never miss a critical deadline.",
      details: [
        "Permit application status tracking",
        "Jurisdiction follow-ups and communication",
        "Inspection scheduling and coordination",
        "Resubmittal management",
        "Compliance documentation",
      ],
    },
    {
      icon: FileText,
      title: "Client Reporting & Communication",
      description: "Professional weekly updates delivered to your clients—showing progress, upcoming work, and action items without you spending hours on reports.",
      details: [
        "Client-ready weekly progress reports",
        "Photo documentation and annotations",
        "Schedule updates and milestones",
        "Budget status and change orders",
        "Action item tracking",
      ],
    },
    {
      icon: Users,
      title: "Vendor & Subcontractor Coordination",
      description: "We manage vendor deliveries, sub scheduling, and follow-ups—keeping your trade partners accountable without endless phone calls.",
      details: [
        "Vendor delivery scheduling and tracking",
        "Subcontractor coordination and follow-ups",
        "Material order status monitoring",
        "Trade partner communication log",
        "Schedule conflict resolution",
      ],
    },
    {
      icon: TrendingUp,
      title: "Project Documentation & Organization",
      description: "Purchase orders, change orders, invoices, lien waivers, receipts—all organized and accessible when you need them.",
      details: [
        "PO and invoice organization",
        "Change order documentation",
        "Lien waiver tracking",
        "Receipt and payment backup",
        "Contract and warranty storage",
      ],
    },
    {
      icon: AlertCircle,
      title: "AI-Powered Risk Monitoring",
      description: "Machine learning algorithms analyze your project data to catch schedule risks, permit delays, and delivery issues before they become expensive problems.",
      details: [
        "AI-powered schedule delay prediction",
        "Automated permit expiration warnings",
        "Smart delivery tracking with anomaly detection",
        "Inspection failure pattern analysis",
        "Budget variance monitoring with AI alerts",
      ],
    },
    {
      icon: Shield,
      title: "Compliance & Safety Documentation",
      description: "Stay compliant with contractor requirements, insurance certificates, safety documentation, and regulatory filings.",
      details: [
        "COI tracking and renewals",
        "Safety documentation management",
        "Licensing and bond tracking",
        "Regulatory filing support",
        "Audit-ready documentation",
      ],
    },
  ]

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative py-16 lg:py-24">
        <Image src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80&auto=format&fit=crop" alt="GC operations support" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Complete Operations Support for General Contractors
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              We become your operations department—handling permits, reporting, vendor coordination, and documentation so you can focus on building and growing your business.
            </p>
          </div>
        </div>
      </section>

      {/* Core Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Core Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything a contractor needs to run professionally without hiring full-time admin staff.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <Card key={service.title} className="bg-gray-50 border-gray-200">
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-100 rounded-xl w-12 h-12 flex items-center justify-center shrink-0">
                        <Icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {service.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{service.description}</p>
                        <ul className="space-y-1">
                          {service.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                              <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Package Comparison */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Package Comparison
            </h2>
            <p className="text-lg text-gray-600">
              Choose the level of operations coverage that fits your business
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Service</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Package A<br/><span className="font-normal text-gray-600">$1,750/mo</span></th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Package B<br/><span className="font-normal text-gray-600">$3,750/mo</span></th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Package C<br/><span className="font-normal text-gray-600">$9,500/mo</span></th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Package D<br/><span className="font-normal text-gray-600">$16,500/mo</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { feature: "Active Projects Covered", a: "1-3", b: "3-8", c: "8-15", d: "15+" },
                    { feature: "Permit Tracking", a: "✓", b: "✓", c: "✓", d: "✓" },
                    { feature: "Inspection Coordination", a: "✓", b: "✓", c: "✓", d: "✓" },
                    { feature: "Weekly Client Reports", a: "✓", b: "✓", c: "✓", d: "✓" },
                    { feature: "Vendor Follow-ups", a: "Basic", b: "✓", c: "✓", d: "✓" },
                    { feature: "Sub Coordination", a: "—", b: "✓", c: "✓", d: "✓" },
                    { feature: "Document Organization", a: "✓", b: "✓", c: "✓", d: "✓" },
                    { feature: "Response Time", a: "24hr", b: "12hr", c: "4hr", d: "SLA" },
                    { feature: "Dedicated Ops Manager", a: "—", b: "—", c: "Shared", d: "Dedicated" },
                    { feature: "Custom Workflows", a: "—", b: "—", c: "—", d: "✓" },
                  ].map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-700">{row.a}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-700">{row.b}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-700">{row.c}</td>
                      <td className="px-6 py-4 text-sm text-center text-gray-700">{row.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button
              asChild
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl"
            >
              <Link href="/gc-services/contact">
                Start Your Free Trial <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Not Sure Which Package Fits Your Business?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Schedule a quick call and we'll help you choose the right level of operations support.
          </p>
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 px-8"
          >
            <Link href="/gc-services/contact">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

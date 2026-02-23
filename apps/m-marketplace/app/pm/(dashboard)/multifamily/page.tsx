"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2,
  DollarSign,
  Layers,
  ArrowRight,
  Home,
  TrendingUp,
  Percent,
  Clock,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"

const modules = [
  {
    title: "Unit Tracker",
    description:
      "Track all 51 units across buildings, floors, and unit types. Monitor completion status, inspections, and turnover readiness.",
    icon: Home,
    href: "/pm/multifamily/units",
    stats: [
      { label: "Total Units", value: "—" },
      { label: "Completed", value: "—" },
    ],
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Lender Draws",
    description:
      "Manage construction loan draw requests. Track AIA G702/G703 applications, schedule of values, and disbursement history.",
    icon: DollarSign,
    href: "/pm/multifamily/draws",
    stats: [
      { label: "Draws Submitted", value: "—" },
      { label: "Total Drawn", value: "—" },
    ],
    color: "text-green-600 bg-green-50",
  },
  {
    title: "Area Phasing",
    description:
      "Define construction phases by area. Assign units to phases, set timelines, and track phase-by-phase completion.",
    icon: Layers,
    href: "/pm/multifamily/phasing",
    stats: [
      { label: "Active Phases", value: "—" },
      { label: "On Schedule", value: "—" },
    ],
    color: "text-purple-600 bg-purple-50",
  },
]

export default function MultifamilyDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Building2 className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Multifamily Management
          </h1>
        </div>
        <p className="text-gray-500 ml-10">
          Comprehensive tools for managing multifamily construction projects —
          unit tracking, lender draws, and area phasing.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Home size={14} />
              Units
            </div>
            <p className="text-2xl font-bold">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Percent size={14} />
              Completion
            </div>
            <p className="text-2xl font-bold">—%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <TrendingUp size={14} />
              Drawn to Date
            </div>
            <p className="text-2xl font-bold">$—</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Clock size={14} />
              Next Draw
            </div>
            <p className="text-2xl font-bold">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {modules.map((mod) => (
          <Card
            key={mod.href}
            className="hover:shadow-md transition-shadow group"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div
                  className={`p-2.5 rounded-lg ${mod.color}`}
                >
                  <mod.icon size={22} />
                </div>
              </div>
              <CardTitle className="text-lg mt-3">{mod.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{mod.description}</p>

              <div className="flex gap-4 mb-4">
                {mod.stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                    <p className="text-lg font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>

              <Link href={mod.href}>
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-gray-50"
                >
                  Open {mod.title}
                  <ArrowRight
                    size={16}
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

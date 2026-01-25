"use client"

export const dynamic = 'force-dynamic'

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Plus, Building2, Calendar, Users } from "lucide-react"

import { api, type DesignProject } from "@/lib/api"

export default function ProjectsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["design-projects"],
    queryFn: () => api.listDesignProjects(),
  })

  const projects = data?.designProjects || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "DRAFT":
        return "bg-neutral-50 text-neutral-700 border-neutral-200"
      case "ON_HOLD":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "COMPLETED":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-neutral-50 text-neutral-700 border-neutral-200"
    }
  }

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case "RESIDENTIAL":
        return "Residential"
      case "COMMERCIAL":
        return "Commercial"
      case "INSTITUTIONAL":
        return "Institutional"
      case "MIXED_USE":
        return "Mixed-Use"
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Design Projects</h1>
            <p className="text-neutral-600">Manage your architectural design projects</p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-neutral-600">Loading projects...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            Error loading projects: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600 mb-4">No design projects yet</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">{project.name}</h3>
                  <span
                    className={`text-xs rounded-full border px-2 py-1 ${getStatusColor(project.status)}`}
                  >
                    {project.status}
                  </span>
                </div>

                {project.description && (
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{project.description}</p>
                )}

                <div className="space-y-2 text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>{getProjectTypeLabel(project.projectType)}</span>
                  </div>

                  {project.phases.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {project.phases.filter((p) => p.status === "COMPLETED").length} / {project.phases.length}{" "}
                        phases
                      </span>
                    </div>
                  )}

                  {project.teamMembers.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{project.teamMembers.length} team member{project.teamMembers.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}

                  {project.budgetTotal && (
                    <div className="pt-2 border-t border-neutral-200">
                      <span className="font-medium">
                        Budget: ${parseFloat(project.budgetTotal).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

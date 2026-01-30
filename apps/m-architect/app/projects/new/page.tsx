"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react"

import { api, type DesignProjectType, type ProjectSummary } from "@/lib/api"

export const dynamic = 'force-dynamic';

export default function NewDesignProjectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = React.useState(1)
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("")
  const [projectType, setProjectType] = React.useState<DesignProjectType | "">("")
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  // Fetch available projects
  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ["available-projects"],
    queryFn: () => api.getAvailableProjects(),
  })

  const projects = projectsData?.projects || []

  // Create design project mutation
  const createMutation = useMutation({
    mutationFn: (data: {
      projectId: string
      name: string
      description?: string
      projectType: DesignProjectType
    }) => api.createDesignProject(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["design-projects"] })
      router.push(`/projects/${data.designProject.id}`)
    },
    onError: (error: Error) => {
      setError(error.message)
    },
  })

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  const handleNext = () => {
    if (step === 1 && !selectedProjectId) {
      setError("Please select a project")
      return
    }
    if (step === 2 && !projectType) {
      setError("Please select a project type")
      return
    }
    if (step === 3 && !name.trim()) {
      setError("Please enter a project name")
      return
    }
    setError(null)
    setStep(step + 1)
  }

  const handleSubmit = () => {
    if (!selectedProjectId || !projectType || !name.trim()) {
      setError("Please complete all required fields")
      return
    }

    createMutation.mutate({
      projectId: selectedProjectId,
      name: name.trim(),
      description: description.trim() || undefined,
      projectType: projectType as DesignProjectType,
    })
  }

  const projectTypes: Array<{ value: DesignProjectType; label: string; description: string }> = [
    { value: "RESIDENTIAL", label: "Residential", description: "Single-family homes, multi-family, custom homes" },
    { value: "COMMERCIAL", label: "Commercial", description: "Office buildings, retail, restaurants, hotels" },
    { value: "INSTITUTIONAL", label: "Institutional", description: "Schools, hospitals, government buildings" },
    { value: "MIXED_USE", label: "Mixed-Use", description: "Combined residential and commercial developments" },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Create New Design Project</h1>
          <p className="text-neutral-600 mb-8">Set up a new design project linked to an existing Project Owner project</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Select Project */}
          {step === 1 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Step 1: Select Project Owner Project</h2>
              <p className="text-neutral-600 mb-6">Choose the Project Owner project to link this design project to.</p>

              {projectsLoading ? (
                <div className="text-center py-8 text-neutral-600">Loading projects...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-600 mb-4">No available projects found.</p>
                  <p className="text-sm text-neutral-500">
                    You need to create a project in the Project Owner hub first, or you may not have access to any projects.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        setSelectedProjectId(project.id)
                        setName(project.name) // Pre-fill name
                        setError(null)
                      }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        selectedProjectId === project.id
                          ? "border-primary bg-primary/5"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{project.name}</h3>
                          {project.description && (
                            <p className="text-sm text-neutral-600 mt-1">{project.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                            <span>Category: {project.category}</span>
                            {project.org && <span>Org: {project.org.name}</span>}
                          </div>
                        </div>
                        {selectedProjectId === project.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={!selectedProjectId || projectsLoading}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Project Type */}
          {step === 2 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Step 2: Project Type</h2>
              <p className="text-neutral-600 mb-6">Select the type of design project.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setProjectType(type.value)
                      setError(null)
                    }}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      projectType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-neutral-900">{type.label}</h3>
                        <p className="text-sm text-neutral-600 mt-1">{type.description}</p>
                      </div>
                      {projectType === type.value && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!projectType}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Project Details */}
          {step === 3 && (
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Step 3: Project Details</h2>
              <p className="text-neutral-600 mb-6">Enter the design project name and description.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError(null)
                    }}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter project description"
                  />
                </div>

                {selectedProject && (
                  <div className="p-4 bg-neutral-50 rounded-lg">
                    <p className="text-sm font-medium text-neutral-700 mb-2">Linked Project Owner Project:</p>
                    <p className="text-sm text-neutral-600">{selectedProject.name}</p>
                    {selectedProject.org && (
                      <p className="text-xs text-neutral-500 mt-1">Organization: {selectedProject.org.name}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!name.trim() || createMutation.isPending}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? "Creating..." : "Create Project"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

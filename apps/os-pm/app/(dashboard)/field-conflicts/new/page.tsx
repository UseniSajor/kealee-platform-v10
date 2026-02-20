"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Camera,
  Crosshair,
  Loader2,
  MapPin,
  Send,
  X,
} from "lucide-react"
import { Button } from "@kealee/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Input } from "@kealee/ui/input"
import { Label } from "@kealee/ui/label"
import { cn } from "@/lib/utils"
import {
  useCreateFieldConflict,
  useCreateRfiFromConflict,
} from "@/hooks/useFieldConflicts"
import { useProjects } from "@/hooks/useProjects"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PHOTOS = 10
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

type Severity = "low" | "medium" | "high" | "critical"

const SEVERITY_OPTIONS: { value: Severity; label: string; activeClass: string }[] = [
  { value: "low", label: "Low", activeClass: "bg-gray-600 text-white ring-gray-600" },
  { value: "medium", label: "Medium", activeClass: "bg-yellow-500 text-white ring-yellow-500" },
  { value: "high", label: "High", activeClass: "bg-orange-500 text-white ring-orange-500" },
  { value: "critical", label: "Critical", activeClass: "bg-red-600 text-white ring-red-600" },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewFieldConflictPage() {
  const router = useRouter()
  const createConflict = useCreateFieldConflict()
  const createRfi = useCreateRfiFromConflict()
  const { data: projectsData } = useProjects()
  const projects = (projectsData as any)?.items ?? projectsData ?? []

  // ---- Form state ----
  const [projectId, setProjectId] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [severity, setSeverity] = React.useState<Severity>("medium")
  const [generateRfi, setGenerateRfi] = React.useState(false)

  // ---- GPS state ----
  const [gpsLat, setGpsLat] = React.useState<number | null>(null)
  const [gpsLng, setGpsLng] = React.useState<number | null>(null)
  const [gpsLoading, setGpsLoading] = React.useState(false)
  const [gpsError, setGpsError] = React.useState<string | null>(null)

  // ---- Photo state ----
  const [photos, setPhotos] = React.useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = React.useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // ---- GPS capture ----
  function captureGps() {
    if (!navigator.geolocation) {
      setGpsError("GPS not available on this device")
      return
    }
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLat(position.coords.latitude)
        setGpsLng(position.coords.longitude)
        setGpsLoading(false)
      },
      (error) => {
        setGpsLoading(false)
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError("GPS permission denied. Please enable location access.")
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError("GPS not available")
        } else {
          setGpsError("Unable to retrieve GPS location")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // ---- Photo handling ----
  function handlePhotosSelected(fileList: FileList | null) {
    if (!fileList) return
    const newFiles: File[] = []
    const newPreviews: string[] = []

    for (let i = 0; i < fileList.length; i++) {
      if (photos.length + newFiles.length >= MAX_PHOTOS) {
        alert(`Maximum ${MAX_PHOTOS} photos allowed.`)
        break
      }
      const file = fileList[i]
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds the 10 MB limit.`)
        continue
      }
      if (!file.type.startsWith("image/")) continue
      newFiles.push(file)
      newPreviews.push(URL.createObjectURL(file))
    }

    setPhotos((prev) => [...prev, ...newFiles])
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      photoPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Submit ----
  const isSubmitting = createConflict.isPending || createRfi.isPending

  function handleSubmit() {
    if (!location.trim() || !description.trim()) {
      alert("Please fill in the location and description.")
      return
    }

    const payload: any = {
      projectId: projectId || undefined,
      location: location.trim(),
      description: description.trim(),
      severity,
      gpsLat,
      gpsLng,
      photoCount: photos.length,
    }

    createConflict.mutate(payload, {
      onSuccess: async (result: any) => {
        const newId = result?.data?.id ?? result?.id
        if (generateRfi && newId) {
          try {
            await createRfi.mutateAsync(newId)
          } catch {
            console.error("Failed to create RFI from conflict")
          }
        }
        router.push("/field-conflicts")
      },
    })
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ---- Back button ---- */}
      <div className="flex items-center gap-4">
        <Link href="/field-conflicts">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
        </Link>
      </div>

      {/* ---- Page heading ---- */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Report Field Conflict
        </h1>
        <p className="text-gray-500 mt-1">
          Document a conflict or discrepancy discovered in the field
        </p>
      </div>

      {/* ---- Main form card ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Conflict Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Project selector */}
          <div>
            <Label className="mb-1.5">Project</Label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm bg-white h-9 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            >
              <option value="">Select project...</option>
              {(Array.isArray(projects) ? projects : []).map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <Label className="mb-1.5">Location *</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Building A, 3rd floor, unit 305"
            />
          </div>

          {/* GPS capture */}
          <div>
            <Label className="mb-1.5">GPS Coordinates</Label>
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 w-fit"
                onClick={captureGps}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Crosshair size={14} />
                )}
                {gpsLoading ? "Capturing..." : "Capture GPS"}
              </Button>
              {gpsLat !== null && gpsLng !== null && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                  <MapPin size={14} />
                  <span>
                    {gpsLat.toFixed(6)}, {gpsLng.toFixed(6)}
                  </span>
                </div>
              )}
              {gpsError && (
                <p className="text-sm text-red-600">{gpsError}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="mb-1.5">Description *</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the conflict in detail. Include what was expected vs. what was found, affected trades, and any safety concerns..."
              className="w-full border rounded-md px-3 py-2 text-sm min-h-[120px] resize-y focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            />
          </div>

          {/* Severity pills */}
          <div>
            <Label className="mb-2">Severity</Label>
            <div className="flex gap-2 flex-wrap">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(opt.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all ring-1",
                    severity === opt.value
                      ? opt.activeClass
                      : "bg-gray-50 text-gray-600 ring-gray-200 hover:bg-gray-100"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Photos card ---- */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera size={16} />
            Photos ({photos.length}/{MAX_PHOTOS})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              handlePhotosSelected(e.target.files)
              e.target.value = ""
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2 w-full sm:w-auto"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
          >
            <Camera size={16} />
            Add Photos
          </Button>
          <p className="text-xs text-gray-400">
            Up to {MAX_PHOTOS} photos, 10 MB each. On mobile, your camera will
            open automatically.
          </p>

          {/* Photo preview grid */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photoPreviews.map((src, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-lg overflow-hidden border bg-gray-50"
                >
                  <img
                    src={src}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- RFI checkbox ---- */}
      <Card>
        <CardContent className="p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={generateRfi}
              onChange={(e) => setGenerateRfi(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Generate RFI Draft
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Automatically create an RFI from this conflict report after
                submission
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      {/* ---- Action buttons ---- */}
      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pb-8">
        <Link href="/field-conflicts">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button
          className="gap-2 w-full sm:w-auto"
          disabled={isSubmitting || !location.trim() || !description.trim()}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </Button>
      </div>
    </div>
  )
}

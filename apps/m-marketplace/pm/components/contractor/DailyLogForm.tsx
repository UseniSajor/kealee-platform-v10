'use client'

/**
 * Daily Log Form Component
 * Allows contractors to create/edit daily log entries
 * Based on Kealee_User_Responsibilities_Guide.md Section 5
 */

import { useState } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'

interface DailyLogFormProps {
  projectId: string
  onSuccess?: () => void
  initialData?: Partial<DailyLogData>
}

interface DailyLogData {
  date: string
  workPerformed: string
  crewCount: number
  hoursWorked: number
  weather: string
  temperature: string
  progressNotes: string
  issues: string
  safetyIncidents: string
  materialsDelivered: string
  equipmentUsed: string
  subsOnSite: string[]
  photoIds: string[]
}

export function DailyLogForm({ projectId, onSuccess, initialData }: DailyLogFormProps) {
  const [formData, setFormData] = useState<Partial<DailyLogData>>(
    initialData || {
      date: new Date().toISOString().split('T')[0],
      workPerformed: '',
      crewCount: undefined,
      hoursWorked: undefined,
      weather: '',
      temperature: '',
      progressNotes: '',
      issues: '',
      safetyIncidents: '',
      materialsDelivered: '',
      equipmentUsed: '',
      subsOnSite: [],
    }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/contractor/pm/projects/${projectId}/pm/daily-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create daily log')
      }

      const result = await response.json()
      setSuccess(true)
      
      if (onSuccess) {
        onSuccess()
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        workPerformed: '',
        crewCount: undefined,
        hoursWorked: undefined,
        weather: '',
        temperature: '',
        progressNotes: '',
        issues: '',
        safetyIncidents: '',
        materialsDelivered: '',
        equipmentUsed: '',
        subsOnSite: [],
      })

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubsChange = (value: string) => {
    const subs = value.split(',').map((s) => s.trim()).filter(Boolean)
    setFormData({ ...formData, subsOnSite: subs })
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Daily Log Entry</CardTitle>
        <CardDescription>
          Record today's work progress, crew information, and any issues encountered
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          {/* Work Performed */}
          <div className="space-y-2">
            <Label htmlFor="workPerformed">Work Performed Today *</Label>
            <Textarea
              id="workPerformed"
              required
              placeholder="Describe what work was completed today..."
              minLength={10}
              maxLength={5000}
              rows={4}
              value={formData.workPerformed}
              onChange={(e) => setFormData({ ...formData, workPerformed: e.target.value })}
            />
            <p className="text-sm text-muted-foreground">
              {formData.workPerformed?.length || 0} / 5000 characters
            </p>
          </div>

          {/* Crew Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crewCount">Crew Count</Label>
              <Input
                id="crewCount"
                type="number"
                min={1}
                max={100}
                placeholder="Number of workers"
                value={formData.crewCount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, crewCount: parseInt(e.target.value) || undefined })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursWorked">Hours Worked</Label>
              <Input
                id="hoursWorked"
                type="number"
                min={0}
                max={24}
                step={0.5}
                placeholder="Total hours"
                value={formData.hoursWorked || ''}
                onChange={(e) =>
                  setFormData({ ...formData, hoursWorked: parseFloat(e.target.value) || undefined })
                }
              />
            </div>
          </div>

          {/* Weather Conditions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weather">Weather</Label>
              <Input
                id="weather"
                placeholder="e.g., Sunny, Rainy, Cloudy"
                maxLength={100}
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                placeholder="e.g., 72°F"
                maxLength={50}
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              />
            </div>
          </div>

          {/* Progress Notes */}
          <div className="space-y-2">
            <Label htmlFor="progressNotes">Progress Notes</Label>
            <Textarea
              id="progressNotes"
              placeholder="Any additional progress notes..."
              maxLength={2000}
              rows={3}
              value={formData.progressNotes}
              onChange={(e) => setFormData({ ...formData, progressNotes: e.target.value })}
            />
          </div>

          {/* Issues */}
          <div className="space-y-2">
            <Label htmlFor="issues">Issues Encountered</Label>
            <Textarea
              id="issues"
              placeholder="Describe any problems or delays..."
              maxLength={2000}
              rows={3}
              value={formData.issues}
              onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
            />
          </div>

          {/* Safety Incidents */}
          <div className="space-y-2">
            <Label htmlFor="safetyIncidents">Safety Incidents</Label>
            <Textarea
              id="safetyIncidents"
              placeholder="Report any safety incidents..."
              maxLength={2000}
              rows={2}
              value={formData.safetyIncidents}
              onChange={(e) => setFormData({ ...formData, safetyIncidents: e.target.value })}
            />
          </div>

          {/* Materials & Equipment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materialsDelivered">Materials Delivered</Label>
              <Textarea
                id="materialsDelivered"
                placeholder="List materials received..."
                maxLength={2000}
                rows={3}
                value={formData.materialsDelivered}
                onChange={(e) => setFormData({ ...formData, materialsDelivered: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentUsed">Equipment Used</Label>
              <Textarea
                id="equipmentUsed"
                placeholder="List equipment used..."
                maxLength={2000}
                rows={3}
                value={formData.equipmentUsed}
                onChange={(e) => setFormData({ ...formData, equipmentUsed: e.target.value })}
              />
            </div>
          </div>

          {/* Subcontractors */}
          <div className="space-y-2">
            <Label htmlFor="subsOnSite">Subcontractors On Site</Label>
            <Input
              id="subsOnSite"
              placeholder="Enter subcontractors, comma-separated (e.g., Electrician, Plumber)"
              value={formData.subsOnSite?.join(', ') || ''}
              onChange={(e) => handleSubsChange(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Separate multiple subcontractors with commas
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
              ✓ Daily log saved successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Daily Log'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

"use client"

import * as React from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Sparkles, Loader2, CheckCircle2, AlertCircle, FileText, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@kealee/ui/card"
import { Button } from "@kealee/ui/button"
import { api } from "@/lib/api-client"

interface AITaskGeneratorProps {
  projectId: string
  projectType: "KITCHEN" | "BATHROOM" | "ADDITION" | "NEW_CONSTRUCTION" | "RENOVATION" | "CUSTOM"
  sowText?: string
  onTasksGenerated?: (tasks: any[]) => void
}

export function AITaskGenerator({
  projectId,
  projectType,
  sowText: initialSowText,
  onTasksGenerated,
}: AITaskGeneratorProps) {
  const [sowText, setSowText] = React.useState(initialSowText || "")
  const [phase, setPhase] = React.useState<"INITIATION" | "PLANNING" | "EXECUTION" | "MONITORING" | "CLOSEOUT">("INITIATION")
  const [includeDeliverables, setIncludeDeliverables] = React.useState(true)

  const generateMutation = useMutation({
    mutationFn: async () => {
      return api.generateTasksFromSOW({
        sowText,
        projectType,
        projectId,
        phase,
        includeDeliverables,
      })
    },
    onSuccess: (data) => {
      if (onTasksGenerated && data.result?.template?.mandatoryTasks) {
        onTasksGenerated(data.result.template.mandatoryTasks)
      }
    },
  })

  const handleGenerate = () => {
    if (!sowText || sowText.length < 50) {
      alert("SOW text must be at least 50 characters")
      return
    }
    generateMutation.mutate()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">AI Task Generator</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SOW Input */}
        <div>
          <label className="text-sm font-medium mb-2 block">Statement of Work (SOW)</label>
          <textarea
            value={sowText}
            onChange={(e) => setSowText(e.target.value)}
            placeholder="Paste the Statement of Work here. The AI will analyze it and generate a comprehensive task breakdown..."
            className="w-full min-h-[200px] p-3 border rounded-lg text-sm"
            disabled={generateMutation.isPending}
          />
          <div className="text-xs text-neutral-500 mt-1">
            {sowText.length} / 50 characters minimum
          </div>
        </div>

        {/* Phase Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Project Phase</label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value as any)}
            className="w-full p-2 border rounded-lg text-sm"
            disabled={generateMutation.isPending}
          >
            <option value="INITIATION">Initiation</option>
            <option value="PLANNING">Planning</option>
            <option value="EXECUTION">Execution</option>
            <option value="MONITORING">Monitoring</option>
            <option value="CLOSEOUT">Closeout</option>
          </select>
        </div>

        {/* Options */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="includeDeliverables"
            checked={includeDeliverables}
            onChange={(e) => setIncludeDeliverables(e.target.checked)}
            disabled={generateMutation.isPending}
            className="rounded"
          />
          <label htmlFor="includeDeliverables" className="text-sm text-neutral-700">
            Include auto-generated deliverables
          </label>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generateMutation.isPending || sowText.length < 50}
          className="w-full"
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Tasks...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Tasks from SOW
            </>
          )}
        </Button>

        {/* Results */}
        {generateMutation.isSuccess && generateMutation.data?.result && (
          <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="flex items-start gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-900 mb-1">Tasks Generated Successfully</h4>
                <div className="text-sm text-emerald-800">
                  Generated {generateMutation.data.result.template.mandatoryTasks.length} mandatory tasks
                </div>
                {generateMutation.data.result.confidence && (
                  <div className="text-xs text-emerald-700 mt-1">
                    Confidence: {Math.round(generateMutation.data.result.confidence * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Task List Preview */}
            <div className="space-y-2 mt-3">
              {generateMutation.data.result.template.mandatoryTasks.slice(0, 5).map((task: any, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-2 bg-white rounded text-sm">
                  <FileText className="h-4 w-4 text-neutral-400 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-neutral-500 flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      {task.estimatedMinutes} min
                      {task.integrationPoints?.length > 0 && (
                        <span className="text-blue-600">
                          • {task.integrationPoints.length} integration(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {generateMutation.data.result.template.mandatoryTasks.length > 5 && (
                <div className="text-xs text-neutral-500 text-center">
                  +{generateMutation.data.result.template.mandatoryTasks.length - 5} more tasks
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {generateMutation.isError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">Generation Failed</h4>
                <div className="text-sm text-red-800">
                  {generateMutation.error instanceof Error
                    ? generateMutation.error.message
                    : "An error occurred while generating tasks"}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


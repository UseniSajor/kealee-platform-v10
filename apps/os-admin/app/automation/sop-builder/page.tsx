"use client"

import * as React from "react"
import { useState } from "react"
import { Save, Play, Plus, Trash2, GripVertical, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  SOPTemplate,
  SOPPhase,
  SOPStep,
  ProjectType,
  IntegrationModule,
  ValidationRule,
  PhaseConnection,
  PROJECT_TYPES,
  INTEGRATION_MODULES,
} from "@/lib/types/sop"

export default function SOPBuilderPage() {
  const [templates, setTemplates] = useState<SOPTemplate[]>([])
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType>("KITCHEN")
  const [phases, setPhases] = useState<SOPPhase[]>([
    {
      id: "phase-1",
      name: "Initiation",
      order: 1,
      steps: [],
    },
  ])
  const [connections, setConnections] = useState<PhaseConnection[]>([])
  const [selectedStep, setSelectedStep] = useState<SOPStep | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<SOPPhase | null>(phases[0])

  const addPhase = () => {
    const newPhase: SOPPhase = {
      id: `phase-${Date.now()}`,
      name: `Phase ${phases.length + 1}`,
      order: phases.length + 1,
      steps: [],
    }
    setPhases([...phases, newPhase])
  }

  const addStepToPhase = (phaseId: string, step?: Partial<SOPStep>) => {
    const phase = phases.find((p) => p.id === phaseId)
    if (!phase) return

    const newStep: SOPStep = {
      id: `step-${Date.now()}`,
      name: step?.name || "New Step",
      description: step?.description,
      phaseId,
      order: phase.steps.length + 1,
      validations: [],
      mandatory: step?.mandatory ?? true,
      dependencies: [],
      ...step,
    }

    const updatedPhases = phases.map((p) =>
      p.id === phaseId ? { ...p, steps: [...p.steps, newStep] } : p
    )
    setPhases(updatedPhases)
    setSelectedStep(newStep)
  }

  const updateStep = (stepId: string, updates: Partial<SOPStep>) => {
    const updatedPhases = phases.map((phase) => ({
      ...phase,
      steps: phase.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)),
    }))
    setPhases(updatedPhases)
    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...selectedStep, ...updates })
    }
  }

  const updateValidation = (stepId: string, validationId: string, updates: Partial<ValidationRule>) => {
    const updatedPhases = phases.map((phase) => ({
      ...phase,
      steps: phase.steps.map((step) =>
        step.id === stepId
          ? {
              ...step,
              validations: step.validations.map((v) =>
                v.id === validationId ? { ...v, ...updates } : v
              ),
            }
          : step
      ),
    }))
    setPhases(updatedPhases)
  }

  const addValidation = (stepId: string) => {
    const newValidation: ValidationRule = {
      id: `validation-${Date.now()}`,
      type: "REQUIRED",
      field: "",
      message: "This field is required",
      blocking: true,
    }
    const updatedPhases = phases.map((phase) => ({
      ...phase,
      steps: phase.steps.map((step) =>
        step.id === stepId
          ? { ...step, validations: [...step.validations, newValidation] }
          : step
      ),
    }))
    setPhases(updatedPhases)
  }

  const saveTemplate = async () => {
    const template: SOPTemplate = {
      id: `template-${Date.now()}`,
      name: `${selectedProjectType} SOP Template`,
      projectType: selectedProjectType,
      phases,
      connections,
      version: 1,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // TODO: Save to API
    console.log("Saving template:", template)
    setTemplates([...templates, template])
  }

  const testTemplate = async () => {
    // TODO: Test with AI
    console.log("Testing template with AI...")
  }

  return (
    <div className="sop-builder min-h-screen bg-neutral-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="builder-header bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">SOP Template Builder</h1>
            <div className="flex items-center gap-3">
              <Select
                value={selectedProjectType}
                onValueChange={(value) => setSelectedProjectType(value as ProjectType)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((pt) => (
                    <SelectItem key={pt.value} value={pt.value}>
                      {pt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={saveTemplate} variant="default">
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
              <Button onClick={testTemplate} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Test with AI
              </Button>
            </div>
          </div>
        </div>

        <div className="builder-content grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Builder */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Workflow Builder</CardTitle>
                  <Button onClick={addPhase} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Phase
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <WorkflowBuilder
                  phases={phases}
                  connections={connections}
                  onAddStep={addStepToPhase}
                  onSelectStep={setSelectedStep}
                  onSelectPhase={setSelectedPhase}
                />
              </CardContent>
            </Card>
          </div>

          {/* Step Configuration */}
          <div className="lg:col-span-1">
            {selectedStep ? (
              <StepConfigurator
                step={selectedStep}
                onUpdate={(updates) => updateStep(selectedStep.id, updates)}
                onUpdateValidation={(validationId, updates) =>
                  updateValidation(selectedStep.id, validationId, updates)
                }
                onAddValidation={() => addValidation(selectedStep.id)}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-neutral-500 text-center">
                    Select a step to configure
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface WorkflowBuilderProps {
  phases: SOPPhase[]
  connections: PhaseConnection[]
  onAddStep: (phaseId: string, step?: Partial<SOPStep>) => void
  onSelectStep: (step: SOPStep) => void
  onSelectPhase: (phase: SOPPhase) => void
}

function WorkflowBuilder({
  phases,
  connections,
  onAddStep,
  onSelectStep,
  onSelectPhase,
}: WorkflowBuilderProps) {
  return (
    <div className="workflow-canvas space-y-4">
      {phases.map((phase) => (
        <PhaseNode
          key={phase.id}
          phase={phase}
          onAddStep={(step) => onAddStep(phase.id, step)}
          onSelectStep={onSelectStep}
          onSelectPhase={onSelectPhase}
        />
      ))}

      {/* Connection lines */}
      <svg className="connections w-full h-full absolute top-0 left-0 pointer-events-none">
        {connections.map((conn) => (
          <ConnectionLine key={conn.id} connection={conn} />
        ))}
      </svg>
    </div>
  )
}

interface PhaseNodeProps {
  phase: SOPPhase
  onAddStep: (step?: Partial<SOPStep>) => void
  onSelectStep: (step: SOPStep) => void
  onSelectPhase: (phase: SOPPhase) => void
}

function PhaseNode({ phase, onAddStep, onSelectStep, onSelectPhase }: PhaseNodeProps) {
  return (
    <Card className="phase-node">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-neutral-400" />
            <CardTitle className="text-lg">{phase.name}</CardTitle>
          </div>
          <Button onClick={() => onSelectPhase(phase)} variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {phase.steps.map((step) => (
            <div
              key={step.id}
              onClick={() => onSelectStep(step)}
              className="flex items-center gap-2 p-2 rounded border hover:bg-neutral-50 cursor-pointer"
            >
              <GripVertical className="h-4 w-4 text-neutral-400" />
              <span className="text-sm flex-1">{step.name}</span>
              {step.mandatory && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                  Required
                </span>
              )}
            </div>
          ))}
          <Button onClick={() => onAddStep()} variant="outline" size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface ConnectionLineProps {
  connection: PhaseConnection
}

function ConnectionLine({ connection }: ConnectionLineProps) {
  // Simplified connection line rendering
  return (
    <line
      x1="0"
      y1="0"
      x2="100"
      y2="100"
      stroke="#3b82f6"
      strokeWidth="2"
      markerEnd="url(#arrowhead)"
    />
  )
}

interface StepConfiguratorProps {
  step: SOPStep
  onUpdate: (updates: Partial<SOPStep>) => void
  onUpdateValidation: (validationId: string, updates: Partial<ValidationRule>) => void
  onAddValidation: () => void
}

function StepConfigurator({
  step,
  onUpdate,
  onUpdateValidation,
  onAddValidation,
}: StepConfiguratorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="step-name">Step Name</Label>
          <Input
            id="step-name"
            value={step.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="step-description">Description</Label>
          <textarea
            id="step-description"
            value={step.description || ""}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full min-h-[80px] px-3 py-2 border rounded-md"
          />
        </div>

        {/* Required Integration */}
        <div>
          <Label htmlFor="required-integration">Required Integration</Label>
          <Select
            value={step.requiredIntegration || ""}
            onValueChange={(value) => onUpdate({ requiredIntegration: value as IntegrationModule })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select integration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {INTEGRATION_MODULES.map((im) => (
                <SelectItem key={im.value} value={im.value}>
                  {im.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Validation Rules */}
        <div className="validation-rules space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Validation Rules</h4>
            <Button onClick={onAddValidation} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
          {step.validations.map((validation) => (
            <ValidationRuleEditor
              key={validation.id}
              rule={validation}
              onUpdate={(updates) => onUpdateValidation(validation.id, updates)}
            />
          ))}
        </div>

        {/* Mandatory vs Optional */}
        <div className="flex items-center justify-between">
          <Label htmlFor="mandatory">Mandatory Step</Label>
          <input
            id="mandatory"
            type="checkbox"
            checked={step.mandatory}
            onChange={(e) => onUpdate({ mandatory: e.target.checked })}
            className="h-4 w-4"
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface ValidationRuleEditorProps {
  rule: ValidationRule
  onUpdate: (updates: Partial<ValidationRule>) => void
}

function ValidationRuleEditor({ rule, onUpdate }: ValidationRuleEditorProps) {
  return (
    <div className="p-3 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <Select
          value={rule.type}
          onValueChange={(value) => onUpdate({ type: value as ValidationRule["type"] })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REQUIRED">Required</SelectItem>
            <SelectItem value="MIN_VALUE">Min Value</SelectItem>
            <SelectItem value="MAX_VALUE">Max Value</SelectItem>
            <SelectItem value="PATTERN">Pattern</SelectItem>
            <SelectItem value="CUSTOM">Custom</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => onUpdate({ blocking: !rule.blocking })}
          variant={rule.blocking ? "default" : "outline"}
          size="sm"
        >
          {rule.blocking ? "Blocking" : "Warning"}
        </Button>
      </div>
      <Input
        placeholder="Field name"
        value={rule.field}
        onChange={(e) => onUpdate({ field: e.target.value })}
      />
      <Input
        placeholder="Error message"
        value={rule.message}
        onChange={(e) => onUpdate({ message: e.target.value })}
      />
    </div>
  )
}

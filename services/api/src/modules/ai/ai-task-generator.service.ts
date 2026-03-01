/**
 * AI Task Generator Service
 * Uses Claude API to generate task templates from SOW
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  TaskTemplate,
  TaskGenerationRequest,
  TaskGenerationResult,
  MandatoryTask,
  Deliverable,
} from './task-template.types'

// Initialize Anthropic client
const anthropicApiKey = process.env.ANTHROPIC_API_KEY
let anthropic: Anthropic | null = null

if (anthropicApiKey) {
  anthropic = new Anthropic({
    apiKey: anthropicApiKey,
  })
} else {
  console.warn('⚠️ ANTHROPIC_API_KEY not set. AI task generation will use mock responses.')
}

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514'

/**
 * Generate tasks from SOW using Claude API
 */
export async function generateTasksFromSOW(
  request: TaskGenerationRequest
): Promise<TaskGenerationResult> {
  const { sowText, projectType, projectId, phase = 'INITIATION', includeDeliverables = true } = request

  const systemPrompt = `You are an expert construction project manager specializing in ${projectType} projects. 
Your task is to analyze Statements of Work (SOW) and generate comprehensive task breakdowns.

Key requirements:
1. Identify all mandatory compliance tasks (permits, inspections, approvals)
2. Include integration points with Kealee modules:
   - m-project-owner: SOW validation, client approvals
   - m-permits-inspections: Permit applications, inspections
   - m-finance-trust: Escrow funding, budget verification
   - m-marketplace: Contractor assignment, resource allocation
   - os-pm: Schedule approval, project management
3. Define task dependencies (what must complete before this task)
4. Estimate realistic time requirements in minutes
5. Identify required deliverables (documents, reports, approvals)

Return a JSON object matching this structure:
{
  "mandatoryTasks": [
    {
      "id": "task-1",
      "title": "Task title",
      "description": "Task description",
      "estimatedMinutes": 60,
      "dependencies": [],
      "integrationPoints": [
        {
          "module": "m-permits-inspections",
          "action": "/permits/apply",
          "required": true
        }
      ],
      "phase": "INITIATION",
      "complianceRequired": true
    }
  ],
  "deliverables": [
    {
      "type": "DOCUMENT",
      "template": "permit-application-template",
      "trigger": "TASK_COMPLETION",
      "taskId": "task-1"
    }
  ]
}`

  const userPrompt = `Analyze this SOW for a ${projectType} project and generate a comprehensive task breakdown:

SOW Text:
${sowText}

Project ID: ${projectId}
Phase: ${phase}

Requirements:
1. Generate mandatory tasks that cannot be skipped
2. Include all compliance-related tasks (permits, inspections, approvals)
3. Define clear task dependencies
4. Add integration points with Kealee modules where tasks interact with other systems
5. Estimate realistic time requirements
6. ${includeDeliverables ? 'Include auto-generated deliverables' : 'Skip deliverables'}

Focus on the ${phase} phase requirements. Return only valid JSON.`

  try {
    if (!anthropic) {
      // Development mode - return mock response
      if (process.env.NODE_ENV === 'development') {
        console.log('🤖 [DEV MODE] AI task generation would be processed')
        return generateMockTaskTemplate(request)
      }
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      temperature: 0.3, // Lower temperature for more consistent task generation
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    // Extract content from response
    const content = response.content
      .map((block: any) => {
        if (block.type === 'text') {
          return block.text
        }
        return ''
      })
      .join('\n')

    // Parse JSON from response (may include markdown code blocks)
    let jsonContent = content.trim()
    
    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
    }

    const parsed = JSON.parse(jsonContent)

    // Build task template
    const template: TaskTemplate = {
      id: `template-${projectId}-${Date.now()}`,
      name: `${projectType} Project - ${phase} Phase`,
      projectType,
      phase,
      mandatoryTasks: parsed.mandatoryTasks || [],
      deliverables: includeDeliverables ? (parsed.deliverables || []) : [],
      description: `AI-generated task template for ${projectType} project in ${phase} phase`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    return {
      template,
      generatedAt: new Date(),
      confidence: 0.85, // Could be calculated based on response quality
      reasoning: `Generated ${template.mandatoryTasks.length} tasks based on SOW analysis`,
    }
  } catch (error: any) {
    console.error('AI task generation error:', error)
    
    // Fallback to mock template on error
    if (process.env.NODE_ENV === 'development') {
      return generateMockTaskTemplate(request)
    }
    
    throw new Error(`Failed to generate tasks: ${error.message}`)
  }
}

/**
 * Generate mock task template for development
 */
function generateMockTaskTemplate(request: TaskGenerationRequest): TaskGenerationResult {
  const { projectType, phase } = request

  const mockTasks: MandatoryTask[] = [
    {
      id: 'task-1',
      title: 'Validate Statement of Work',
      description: 'Review and validate the SOW with client',
      estimatedMinutes: 30,
      dependencies: [],
      integrationPoints: [
        {
          module: 'm-project-owner',
          action: '/projects/validate-sow',
          required: true,
        },
      ],
      phase: 'INITIATION',
      complianceRequired: true,
    },
    {
      id: 'task-2',
      title: 'Submit Permit Application',
      description: 'Submit permit application to jurisdiction',
      estimatedMinutes: 60,
      dependencies: ['task-1'],
      integrationPoints: [
        {
          module: 'm-permits-inspections',
          action: '/permits/apply',
          required: true,
        },
      ],
      phase: 'INITIATION',
      complianceRequired: true,
    },
    {
      id: 'task-3',
      title: 'Fund Escrow Account',
      description: 'Set up and fund escrow account',
      estimatedMinutes: 45,
      dependencies: ['task-1'],
      integrationPoints: [
        {
          module: 'm-finance-trust',
          action: '/escrow/fund',
          required: true,
        },
      ],
      phase: 'INITIATION',
      complianceRequired: true,
    },
  ]

  const mockDeliverables: Deliverable[] = [
    {
      type: 'DOCUMENT',
      template: 'sow-validation-template',
      trigger: 'TASK_COMPLETION',
      taskId: 'task-1',
    },
    {
      type: 'APPROVAL',
      trigger: 'TASK_COMPLETION',
      taskId: 'task-2',
    },
  ]

  const template: TaskTemplate = {
    id: `template-mock-${Date.now()}`,
    name: `${projectType} Project - ${phase || 'INITIATION'} Phase (Mock)`,
    projectType,
    phase: phase || 'INITIATION',
    mandatoryTasks: mockTasks,
    deliverables: request.includeDeliverables ? mockDeliverables : [],
    description: 'Mock task template for development',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return {
    template,
    generatedAt: new Date(),
    confidence: 0.5,
    reasoning: 'Mock template generated (ANTHROPIC_API_KEY not set)',
  }
}

/**
 * Save task template to database
 */
export async function saveTaskTemplate(template: TaskTemplate): Promise<TaskTemplate> {
  // This would save to database
  // For now, return the template
  return template
}

/**
 * Get task template by ID
 */
export async function getTaskTemplate(templateId: string): Promise<TaskTemplate | null> {
  // This would fetch from database
  return null
}

/**
 * List task templates by project type
 */
export async function listTaskTemplates(projectType?: string): Promise<TaskTemplate[]> {
  // This would fetch from database
  return []
}

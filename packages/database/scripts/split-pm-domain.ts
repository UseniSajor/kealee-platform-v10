#!/usr/bin/env node
/**
 * PM Domain Sub-Splitter — Breaks pm/models.prisma into logical sub-files.
 *
 * PM is the largest domain (157 models) so we split it into sub-files:
 *   - projects.prisma — Project, ProjectPhase, ProjectMembership, etc.
 *   - schedule.prisma — ScheduleItem, Task, LookaheadItem
 *   - rfis-submittals.prisma — RFI, RFIResponse, Submittal, SubmittalReview
 *   - change-orders.prisma — ChangeOrder, ChangeOrderApproval, ChangeOrderLineItem
 *   - inspections.prisma — Inspection, InspectionFinding, etc.
 *   - daily-logs.prisma — DailyLog, Photo, WeatherLog, CrewCheckIn
 *   - meetings.prisma — Meeting, MeetingAttendee, MeetingActionItem
 *   - documents-drawings.prisma — DrawingSet, DrawingSheet, Document-related
 *   - budget.prisma — BudgetLine, BudgetEntry, BudgetAlert, BudgetSnapshot, CostCode
 *   - closeout.prisma — CloseoutItem
 *   - safety.prisma — SafetyIncident, ToolboxTalk, SiteCheckIn
 *   - permits.prisma — Permit, Jurisdiction, routing, assignments
 *   - design.prisma — DesignProject, DesignPhase, architect models
 *   - estimation.prisma — Estimate, Assembly, CostDatabase, Takeoff
 *   - bids.prisma — Bid, BidOpportunity, OpportunityBid
 *   - sops.prisma — SOPTemplate, SOPPhase, SOPStep
 *   - procurement.prisma — PurchaseOrder, Bill, RFQ, Delivery
 *   - selections.prisma — Selection, SelectionOption
 *   - warranty.prisma — Warranty, WarrantyClaim
 *   - multifamily.prisma — MultifamilyUnit, MultifamilyAreaPhase, DrawRequest
 *   - field-ops.prisma — FieldConflict, MobilizationChecklist, SiteVisit, SensorDevice
 *   - reports.prisma — Report, ReportTemplate, WeeklyReport
 */

import * as fs from 'fs'
import * as path from 'path'

const PM_DIR = path.join(__dirname, '..', 'schema-src', 'pm')
const MODELS_FILE = path.join(PM_DIR, 'models.prisma')

// Sub-file classification
const SUB_FILES: Record<string, string[]> = {
  'projects.prisma': [
    'Project', 'ProjectPhase', 'PhaseMilestone', 'ProjectPhaseHistory',
    'ProjectMembership', 'ProjectManager', 'PreConProject', 'PreConPhaseHistory',
    'Property',
  ],
  'schedule.prisma': ['ScheduleItem', 'Task', 'TaskComment', 'LookaheadItem'],
  'rfis-submittals.prisma': ['RFI', 'RFIResponse', 'Submittal', 'SubmittalReview'],
  'change-orders.prisma': ['ChangeOrder', 'ChangeOrderApproval', 'ChangeOrderLineItem'],
  'inspections.prisma': [
    'Inspection', 'InspectionFinding', 'InspectionPreparationItem',
    'QAInspectionResult', 'Issue', 'QualityIssue',
  ],
  'daily-logs.prisma': ['DailyLog', 'Photo', 'WeatherLog', 'CrewCheckIn'],
  'meetings.prisma': ['Meeting', 'MeetingAttendee', 'MeetingActionItem'],
  'drawings.prisma': ['DrawingSet', 'DrawingSheet', 'BIMModel'],
  'budget.prisma': [
    'BudgetLine', 'BudgetEntry', 'BudgetAlert', 'BudgetSnapshot',
    'BudgetItem', 'BudgetTransaction', 'CostCode',
  ],
  'closeout.prisma': ['CloseoutItem'],
  'safety.prisma': [
    'SafetyIncident', 'ToolboxTalk', 'ToolboxTalkAttendee',
    'SiteCheckIn', 'SiteVisit', 'VisitChecklist',
  ],
  'time-entries.prisma': ['TimeEntry'],
  'permits.prisma': [
    'Permit', 'PermitSubmission', 'PermitCorrection', 'PermitEvent',
    'PermitRouting', 'PermitNotification', 'PermitTemplate', 'PermitActivity',
    'Jurisdiction', 'JurisdictionStaff', 'JurisdictionUsageMetrics',
    'JurisdictionFormTemplate', 'JurisdictionIntegrationLog', 'JurisdictionAnalytics',
    'RoutingRule', 'AIReviewResult', 'ReviewAssignment', 'InspectionAssignment',
    'RemoteInspection', 'ExpeditedPermitService',
  ],
  'design.prisma': [
    'ArchitectOnboarding', 'DesignTemplate', 'DesignTemplateInstance',
    'StandardDetail', 'StandardDetailInstance', 'DesignProject', 'DesignTeamMember',
    'DesignPhase', 'DesignFile', 'DesignRevision', 'DesignConcept', 'DesignHandoff',
    'DesignPermitPackage', 'DesignQCChecklist', 'DesignQueueAssignment',
    'DesignProfessionalProfile', 'AutoDesignSession', 'AutoDesignOption',
    'AutoDesignRevisionRequest', 'ReviewRequest', 'VersionBranch',
  ],
  'estimation.prisma': [
    'Estimate', 'EstimateLineItem', 'EstimateSection', 'EstimateComparison',
    'EstimateHistory', 'EstimationOrder', 'QuickEstimate', 'Assembly', 'AssemblyItem',
    'CostDatabase', 'CostDataReview', 'CostBookCustomization', 'CostCodeImportJob',
    'LaborRate', 'MaterialCost', 'EquipmentRate', 'Takeoff', 'TakeoffJob',
    'TakeoffMeasurement', 'SubcontractorQuote', 'RegionalCostIndex',
    'HistoricalProjectCost', 'AIEstimationSession',
  ],
  'bids.prisma': [
    'Bid', 'BidRequest', 'BidSubmission', 'BidEvaluation',
    'OpportunityBid', 'OpportunityBidDocument', 'OpportunityBidChecklist',
    'OpportunityBidActivity', 'BidOpportunity', 'BidChecklistItem', 'BidDocument',
    'BidActivity', 'BidSubRequest', 'BidEmbedding', 'BidSimilarity', 'BidScanLog',
    'BidInvitation',
  ],
  'sops.prisma': ['SOPTemplate', 'SOPPhase', 'SOPStep', 'SOPExecution', 'SOPStepExecution'],
  'procurement.prisma': ['PurchaseOrder', 'Bill', 'RFQ', 'Delivery'],
  'selections.prisma': ['Selection', 'SelectionOption'],
  'warranty.prisma': ['Warranty', 'WarrantyClaim'],
  'multifamily.prisma': ['MultifamilyUnit', 'MultifamilyAreaPhase', 'DrawRequest'],
  'field-ops.prisma': [
    'FieldConflict', 'MobilizationChecklist', 'SensorDevice', 'SensorReading',
    'BeforeAfterPair', 'SpatialScan', 'SpatialVerification',
  ],
  'reports.prisma': ['Report', 'ReportTemplate', 'WeeklyReport'],
  'misc.prisma': [
    'PerformanceBenchmark', 'BackupRecord', 'DisasterRecoveryPlan',
    'RiskAssessment', 'MilestoneApproval', 'Product', 'ProjectItem',
  ],
}

interface ModelBlock {
  name: string
  content: string
}

function parseModels(filePath: string): ModelBlock[] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const lines = raw.split('\n')
  const blocks: ModelBlock[] = []

  let i = 0
  while (i < lines.length) {
    const match = lines[i].match(/^model\s+(\w+)\s*\{/)
    if (match) {
      const name = match[1]
      const startLine = i
      let braceCount = 1
      let j = i + 1
      while (j < lines.length && braceCount > 0) {
        for (const ch of lines[j]) {
          if (ch === '{') braceCount++
          if (ch === '}') braceCount--
        }
        j++
      }
      // Capture preceding comments
      let commentStart = startLine
      for (let k = startLine - 1; k >= Math.max(0, startLine - 5); k--) {
        const cl = lines[k].trim()
        if (cl.startsWith('//') && !cl.startsWith('// ===') && !cl.startsWith('// ---') && !cl.startsWith('// PM')) {
          commentStart = k
        } else {
          break
        }
      }
      blocks.push({
        name,
        content: lines.slice(commentStart, j).join('\n'),
      })
      i = j
    } else {
      i++
    }
  }
  return blocks
}

function main() {
  const models = parseModels(MODELS_FILE)
  console.log(`Parsed ${models.length} models from pm/models.prisma\n`)

  // Build reverse map
  const modelToFile: Record<string, string> = {}
  for (const [file, names] of Object.entries(SUB_FILES)) {
    for (const name of names) {
      modelToFile[name] = file
    }
  }

  // Write sub-files
  const fileContents: Record<string, string[]> = {}
  const unmatched: string[] = []

  for (const model of models) {
    const targetFile = modelToFile[model.name]
    if (targetFile) {
      if (!fileContents[targetFile]) fileContents[targetFile] = []
      fileContents[targetFile].push(model.content)
    } else {
      unmatched.push(model.name)
    }
  }

  for (const [file, contents] of Object.entries(fileContents)) {
    const header = `// PM — ${file.replace('.prisma', '').replace(/-/g, ' ').toUpperCase()}\n// Domain: pm | Owner: OS-PM service\n`
    fs.writeFileSync(path.join(PM_DIR, file), header + '\n' + contents.join('\n\n') + '\n')
    console.log(`  ${file}: ${contents.length} models`)
  }

  if (unmatched.length > 0) {
    console.log(`\nUnmatched models (staying in models.prisma): ${unmatched.join(', ')}`)
  }

  // Remove the original models.prisma (now split into sub-files)
  console.log('\nRemoving original pm/models.prisma...')
  fs.unlinkSync(MODELS_FILE)

  console.log('Done! PM domain split into sub-files.')
}

main()

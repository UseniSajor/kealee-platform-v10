import type { ToolDefinition, ToolExecutor } from '../types';

// Read-only tools
import * as getProjectStatus from './get-project-status';
import * as getProjectBudget from './get-project-budget';
import * as getProjectSchedule from './get-project-schedule';
import * as getProjectPhotos from './get-project-photos';
import * as getTaskList from './get-task-list';
import * as getDecisionQueue from './get-decision-queue';
import * as getBidStatus from './get-bid-status';
import * as getContractorInfo from './get-contractor-info';
import * as getWeeklyReport from './get-weekly-report';
import * as searchProjects from './search-projects';

// Bid pipeline tools
import * as getBidPipeline from './get-bid-pipeline';
import * as getBidAlerts from './get-bid-alerts';
import * as searchBids from './search-bids';
import * as analyzeBid from './analyze-bid';

// Action tools
import * as approveDecision from './approve-decision';
import * as rescheduleTask from './reschedule-task';
import * as sendMessage from './send-message';
import * as requestChangeOrder from './request-change-order';

const toolModules = [
  getProjectStatus,
  getProjectBudget,
  getProjectSchedule,
  getProjectPhotos,
  getTaskList,
  getDecisionQueue,
  getBidStatus,
  getContractorInfo,
  getWeeklyReport,
  searchProjects,
  getBidPipeline,
  getBidAlerts,
  searchBids,
  analyzeBid,
  approveDecision,
  rescheduleTask,
  sendMessage,
  requestChangeOrder,
];

/** All tool definitions for Anthropic's tools parameter */
export const allToolDefinitions: ToolDefinition[] = toolModules.map(
  (m) => m.definition,
);

/** Map of tool name → executor function */
export const toolExecutors: Record<string, ToolExecutor> = {};
for (const mod of toolModules) {
  toolExecutors[mod.definition.name] = mod.execute;
}

/** Get a single tool definition by name */
export function getToolDefinition(
  name: string,
): ToolDefinition | undefined {
  return allToolDefinitions.find((t) => t.name === name);
}

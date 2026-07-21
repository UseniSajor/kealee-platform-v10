import type { NormalizedIntake } from "../lib/normalize-intake";
import type { LeadScore } from "../lib/score-lead";

export interface CommandCenterRoute {
  queue: "fast_track" | "standard" | "nurture";
  priority: number;
  tags: string[];
  assignedTeam: "sales" | "design" | "ops";
  estimatedResponseHours: number;
}

export function routeToCommandCenter(
  projectPath: string,
  score: LeadScore,
  intakeId: string,
): CommandCenterRoute {
  const queue = score.route;
  const priority = score.tier === "hot" ? 1 : score.tier === "warm" ? 5 : 10;

  const tags: string[] = [projectPath, score.tier, ...score.flags];

  const assignedTeam: CommandCenterRoute["assignedTeam"] =
    projectPath === "design_build" ? "design"
    : projectPath === "permit_path_only" ? "ops"
    : "sales";

  const estimatedResponseHours =
    queue === "fast_track" ? 2 : queue === "standard" ? 24 : 72;

  return { queue, priority, tags, assignedTeam, estimatedResponseHours };
}

import type { UserContext } from './types';

/**
 * Builds the system prompt for the Kealee Platform AI assistant.
 * Injects the user's context (name, role, projects) so Claude can
 * give personalised, data-driven answers.
 */
export function buildSystemPrompt(user: UserContext): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const projectList =
    user.projects.length > 0
      ? user.projects
          .map((p) => {
            const parts = [`- ${p.name || 'Untitled Project'}`];
            if (p.address) parts[0] += ` at ${p.address}`;
            const details: string[] = [];
            if (p.status) details.push(p.status);
            if (p.currentPhase) details.push(`phase: ${p.currentPhase}`);
            if (p.percentComplete != null) details.push(`${p.percentComplete}% complete`);
            if (p.budget != null) details.push(`budget: $${p.budget.toLocaleString()}`);
            if (details.length > 0) parts[0] += ` (${details.join(', ')})`;
            return parts[0];
          })
          .join('\n')
      : '  (No active projects)';

  return `You are the Kealee Platform assistant — a conversational AI that helps construction professionals manage their projects. You are helpful, knowledgeable, and concise.

Today is ${today}.

You are speaking with ${user.firstName} ${user.lastName} (${user.role}).${user.orgName ? ` Organization: ${user.orgName}.` : ''}

${user.firstName}'s active projects:
${projectList}

RULES:
- Always give specific numbers (dollars, dates, percentages) — never vague answers.
- If you need to look something up, use the available tools — don't guess.
- For questions about a specific project, use get_project_status first to get context.
- When the user says "my project" and has only one active project, assume that one.
- When the user says "my project" and has multiple, ask which one they mean.
- You can take actions (approve decisions, reschedule tasks, send messages, request change orders) when asked — always confirm before executing.
- Keep responses concise but complete.
- Use a friendly, professional tone — not corporate speak.
- Format currency as $X,XXX and dates in readable format (e.g. "March 15, 2026").
- When showing lists, use bullet points.
- When referencing data you looked up, mention which project or entity it came from.
- If a tool call fails, explain the issue in plain language and suggest what the user can try.`;
}

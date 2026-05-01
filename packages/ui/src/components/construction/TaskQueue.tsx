// packages/ui/src/components/construction/TaskQueue.tsx
// PM Task Queue — prioritized task list with AI scores and one-click actions

import React from 'react';
import { cn } from '../../lib/utils';
import { Clock, ChevronRight, AlertCircle, CheckCircle, User, Zap } from 'lucide-react';

export type TaskPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';

export interface QueueTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  score: number; // 0–100 AI priority score
  dueAt?: Date | string;
  clientName?: string;
  projectName?: string;
  onComplete?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onView?: (id: string) => void;
}

export interface TaskQueueProps {
  tasks: QueueTask[];
  title?: string;
  showScores?: boolean;
  className?: string;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; dot: string; text: string }> = {
  CRITICAL: { label: 'Critical', dot: 'bg-error-500', text: 'text-error-700' },
  HIGH:     { label: 'High',     dot: 'bg-warning-500', text: 'text-warning-700' },
  MEDIUM:   { label: 'Medium',  dot: 'bg-primary-500', text: 'text-primary-700' },
  LOW:      { label: 'Low',      dot: 'bg-gray-400', text: 'text-gray-600' },
};

const STATUS_CONFIG: Record<TaskStatus, { icon: React.ElementType; label: string; color: string }> = {
  PENDING:     { icon: Clock, label: 'Pending', color: 'text-gray-500' },
  IN_PROGRESS: { icon: Zap, label: 'In Progress', color: 'text-primary-600' },
  COMPLETED:   { icon: CheckCircle, label: 'Completed', color: 'text-success-600' },
  ESCALATED:   { icon: AlertCircle, label: 'Escalated', color: 'text-error-600' },
};

function formatDue(due: Date | string): string {
  const d = typeof due === 'string' ? new Date(due) : due;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.round(diffMs / 3_600_000);
  if (diffH < 0) return `${Math.abs(diffH)}h overdue`;
  if (diffH < 24) return `Due in ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  return `Due in ${diffD}d`;
}

function ScoreIndicator({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full',
            score >= 80 ? 'bg-error-500' : score >= 60 ? 'bg-warning-500' : 'bg-primary-500'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono text-gray-500">{score}</span>
    </div>
  );
}

export function TaskQueue({ tasks, title = 'Work Queue', showScores = true, className }: TaskQueueProps) {
  const sorted = [...tasks].sort((a, b) => b.score - a.score);

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
          {tasks.filter((t) => t.status !== 'COMPLETED').length} pending
        </span>
      </div>

      {/* Task list */}
      <ul className="divide-y divide-gray-50">
        {sorted.map((task) => {
          const priority = PRIORITY_CONFIG[task.priority];
          const status = STATUS_CONFIG[task.status];
          const StatusIcon = status.icon;

          return (
            <li
              key={task.id}
              className={cn(
                'px-4 py-3 hover:bg-gray-50/50 transition-colors',
                task.status === 'COMPLETED' && 'opacity-60'
              )}
            >
              <div className="flex items-start gap-3">
                {/* Priority dot + score */}
                <div className="flex flex-col items-center gap-1 pt-0.5">
                  <div className={cn('w-2.5 h-2.5 rounded-full', priority.dot)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-medium text-gray-900 leading-tight', task.status === 'COMPLETED' && 'line-through')}>
                      {task.title}
                    </p>
                    {task.onView && (
                      <button
                        onClick={() => task.onView?.(task.id)}
                        className="text-gray-400 hover:text-gray-600 shrink-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{task.description}</p>
                  )}

                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                    {/* Status */}
                    <div className={cn('flex items-center gap-1', status.color)}>
                      <StatusIcon className="w-3 h-3" />
                      <span className="text-xs">{status.label}</span>
                    </div>

                    {/* Priority */}
                    <span className={cn('text-xs font-medium', priority.text)}>{priority.label}</span>

                    {/* Due */}
                    {task.dueAt && (
                      <span className="text-xs text-gray-500">{formatDue(task.dueAt)}</span>
                    )}

                    {/* Client */}
                    {task.clientName && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        {task.clientName}
                      </div>
                    )}

                    {/* Score */}
                    {showScores && <ScoreIndicator score={task.score} />}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              {task.status !== 'COMPLETED' && (task.onComplete || task.onEscalate) && (
                <div className="flex items-center gap-2 mt-2 ml-5">
                  {task.onComplete && (
                    <button
                      onClick={() => task.onComplete?.(task.id)}
                      className="text-xs px-2.5 py-1 bg-success-50 hover:bg-success-100 text-success-700 rounded-md transition-colors font-medium"
                    >
                      Complete
                    </button>
                  )}
                  {task.onEscalate && (
                    <button
                      onClick={() => task.onEscalate?.(task.id)}
                      className="text-xs px-2.5 py-1 bg-warning-50 hover:bg-warning-100 text-warning-700 rounded-md transition-colors font-medium"
                    >
                      Escalate
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}

        {tasks.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-gray-400">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-success-400" />
            All tasks complete!
          </li>
        )}
      </ul>
    </div>
  );
}

// packages/ui/src/components/cards/TaskCard.tsx
// Task queue card for displaying tasks in kanban boards and lists

'use client';

import React from 'react';
import Link from 'next/link';
import {
  Clock,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Circle,
  PlayCircle,
  PauseCircle,
  XCircle,
  Flag,
  MessageSquare,
  Paperclip,
  ChevronRight,
  GripVertical,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'in_review'
  | 'blocked'
  | 'completed'
  | 'cancelled';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface TaskAssignee {
  id: string;
  name: string;
  avatar?: string;
}

export interface TaskCardProps {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: TaskAssignee;
  dueDate?: Date | string;
  createdAt?: Date | string;
  projectName?: string;
  projectColor?: string;
  estimatedHours?: number;
  actualHours?: number;
  commentCount?: number;
  attachmentCount?: number;
  subtaskCount?: number;
  subtaskCompleted?: number;
  tags?: string[];
  isOverdue?: boolean;
  href?: string;
  onClick?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  draggable?: boolean;
  variant?: 'default' | 'compact' | 'kanban';
  className?: string;
}

const statusConfig: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string; icon: LucideIcon }
> = {
  todo: {
    label: 'To Do',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: Circle,
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: PlayCircle,
  },
  in_review: {
    label: 'In Review',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    icon: PauseCircle,
  },
  blocked: {
    label: 'Blocked',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: AlertCircle,
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: XCircle,
  },
};

const priorityConfig: Record<
  TaskPriority,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  urgent: {
    label: 'Urgent',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-l-red-500',
  },
  high: {
    label: 'High',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-l-orange-500',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-l-amber-500',
  },
  low: {
    label: 'Low',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-l-blue-400',
  },
};

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days < -1) return `${Math.abs(days)} days ago`;
  if (days < 7) return `${days} days`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TaskCard({
  id,
  title,
  description,
  status,
  priority,
  assignee,
  dueDate,
  createdAt,
  projectName,
  projectColor,
  estimatedHours,
  actualHours,
  commentCount,
  attachmentCount,
  subtaskCount,
  subtaskCompleted,
  tags,
  isOverdue,
  href,
  onClick,
  onStatusChange,
  draggable = false,
  variant = 'default',
  className,
}: TaskCardProps) {
  const statusInfo = statusConfig[status];
  const priorityInfo = priorityConfig[priority];
  const StatusIcon = statusInfo.icon;

  const CardWrapper = href ? Link : 'div';
  const cardProps = href
    ? { href }
    : onClick
      ? { onClick, role: 'button', tabIndex: 0 }
      : {};

  // Kanban variant - optimized for drag and drop boards
  if (variant === 'kanban') {
    return (
      <CardWrapper
        {...(cardProps as any)}
        className={cn(
          'block bg-white rounded-lg border border-gray-200 p-3',
          'hover:shadow-md hover:border-gray-300 transition-all',
          'border-l-4',
          priorityInfo.borderColor,
          onClick || href ? 'cursor-pointer' : '',
          draggable && 'cursor-grab active:cursor-grabbing',
          className
        )}
      >
        {/* Header with grip and project */}
        <div className="flex items-start gap-2 mb-2">
          {draggable && (
            <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            {projectName && (
              <div className="flex items-center gap-1.5 mb-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: projectColor || '#6366F1' }}
                />
                <span className="text-xs text-gray-500 truncate">{projectName}</span>
              </div>
            )}
            <h3 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
              {title}
            </h3>
          </div>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-gray-400 text-xs">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Subtasks progress */}
        {subtaskCount !== undefined && subtaskCount > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Subtasks</span>
              <span className="text-gray-700">{subtaskCompleted || 0}/{subtaskCount}</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${((subtaskCompleted || 0) / subtaskCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {dueDate && (
              <div
                className={cn(
                  'flex items-center gap-1',
                  isOverdue && 'text-red-600'
                )}
              >
                <Calendar className="w-3 h-3" />
                <span>{formatDate(dueDate)}</span>
              </div>
            )}
            {commentCount !== undefined && commentCount > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                <span>{commentCount}</span>
              </div>
            )}
            {attachmentCount !== undefined && attachmentCount > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                <span>{attachmentCount}</span>
              </div>
            )}
          </div>

          {assignee && (
            assignee.avatar ? (
              <img
                src={assignee.avatar}
                alt={assignee.name}
                className="w-6 h-6 rounded-full border-2 border-white"
                title={assignee.name}
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                title={assignee.name}
              >
                {assignee.name.charAt(0)}
              </div>
            )
          )}
        </div>
      </CardWrapper>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <CardWrapper
        {...(cardProps as any)}
        className={cn(
          'flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200',
          'hover:shadow-md hover:border-gray-300 transition-all cursor-pointer',
          className
        )}
      >
        <div
          className={cn(
            'w-1.5 h-10 rounded-full flex-shrink-0',
            priority === 'urgent'
              ? 'bg-red-500'
              : priority === 'high'
                ? 'bg-orange-500'
                : priority === 'medium'
                  ? 'bg-amber-500'
                  : 'bg-blue-400'
          )}
        />

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{title}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {projectName && <span>{projectName}</span>}
            {dueDate && (
              <>
                <span>•</span>
                <span className={cn(isOverdue && 'text-red-600')}>
                  Due {formatDate(dueDate)}
                </span>
              </>
            )}
          </div>
        </div>

        {assignee && (
          assignee.avatar ? (
            <img
              src={assignee.avatar}
              alt={assignee.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {assignee.name.charAt(0)}
            </div>
          )
        )}

        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium flex-shrink-0',
            statusInfo.bgColor,
            statusInfo.color
          )}
        >
          {statusInfo.label}
        </span>

        <ChevronRight className="w-4 h-4 text-gray-400" />
      </CardWrapper>
    );
  }

  // Default variant
  return (
    <CardWrapper
      {...(cardProps as any)}
      className={cn(
        'block bg-white rounded-xl border border-gray-200 p-5',
        'border-l-4',
        priorityInfo.borderColor,
        'hover:shadow-lg hover:border-gray-300 transition-all',
        onClick || href ? 'cursor-pointer' : '',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {projectName && (
            <div className="flex items-center gap-1.5 mb-1">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: projectColor || '#6366F1' }}
              />
              <span className="text-sm text-gray-500">{projectName}</span>
            </div>
          )}
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
          )}
        </div>

        <span
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-3',
            statusInfo.bgColor,
            statusInfo.color
          )}
        >
          <StatusIcon className="w-3 h-3" />
          {statusInfo.label}
        </span>
      </div>

      {/* Priority and tags */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
            priorityInfo.bgColor,
            priorityInfo.color
          )}
        >
          <Flag className="w-3 h-3" />
          {priorityInfo.label}
        </span>
        {tags && tags.map((tag, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Subtasks progress */}
      {subtaskCount !== undefined && subtaskCount > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">Subtasks</span>
            <span className="font-medium text-gray-700">
              {subtaskCompleted || 0} of {subtaskCount}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${((subtaskCompleted || 0) / subtaskCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Time tracking */}
      {estimatedHours !== undefined && (
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Est:</span>
            <span className="font-medium text-gray-700">{estimatedHours}h</span>
          </div>
          {actualHours !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Actual:</span>
              <span
                className={cn(
                  'font-medium',
                  actualHours > estimatedHours ? 'text-red-600' : 'text-green-600'
                )}
              >
                {actualHours}h
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-4">
          {/* Assignee */}
          {assignee && (
            <div className="flex items-center gap-2">
              {assignee.avatar ? (
                <img
                  src={assignee.avatar}
                  alt={assignee.name}
                  className="w-7 h-7 rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                  {assignee.name.charAt(0)}
                </div>
              )}
              <span className="text-sm text-gray-600">{assignee.name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          {dueDate && (
            <div
              className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-red-600 font-medium'
              )}
            >
              <Calendar className="w-4 h-4" />
              <span>{formatDate(dueDate)}</span>
            </div>
          )}
          {commentCount !== undefined && commentCount > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{commentCount}</span>
            </div>
          )}
          {attachmentCount !== undefined && attachmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-4 h-4" />
              <span>{attachmentCount}</span>
            </div>
          )}
        </div>
      </div>
    </CardWrapper>
  );
}

export default TaskCard;

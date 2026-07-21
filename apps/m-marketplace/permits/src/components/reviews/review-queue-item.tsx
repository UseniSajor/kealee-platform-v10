// ============================================================
// REVIEW QUEUE ITEM COMPONENT
// ============================================================

'use client';

import { Card, CardContent } from '@permits/src/components/ui/card';
import { Badge } from '@permits/src/components/ui/badge';
import { Button } from '@permits/src/components/ui/button';
import { 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle,
  ArrowRight,
  Brain,
  Calendar
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface ReviewQueueItemProps {
  item: {
    id: string;
    permitId: string;
    permitNumber: string;
    permitType: string;
    projectName: string;
    submittedAt: Date;
    deadline: Date;
    priority: 'high' | 'medium' | 'low';
    complexity: number;
    estimatedReviewTime: number;
    assignedTo?: string;
    assignedToName?: string;
    discipline: string;
    aiScore?: number;
    aiFindings?: number;
    status: 'unassigned' | 'assigned' | 'in_progress' | 'completed';
  };
}

export function ReviewQueueItem({ item }: ReviewQueueItemProps) {
  const priorityColors = {
    high: 'destructive',
    medium: 'secondary',
    low: 'outline',
  } as const;

  const statusColors = {
    unassigned: 'outline',
    assigned: 'secondary',
    in_progress: 'default',
    completed: 'default',
  } as const;

  const daysUntilDeadline = Math.ceil(
    (new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const isUrgent = daysUntilDeadline <= 2 && item.priority === 'high';

  return (
    <Card className={`hover:shadow-md transition-shadow ${isUrgent ? 'border-red-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/dashboard/reviews/${item.id}`}
                    className="font-semibold text-lg hover:underline"
                  >
                    {item.permitNumber}
                  </Link>
                  <Badge variant={priorityColors[item.priority]}>
                    {item.priority}
                  </Badge>
                  <Badge variant={statusColors[item.status]}>
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.projectName}
                </p>
              </div>
              {item.aiScore !== undefined && (
                <div className="flex items-center gap-1 text-sm">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">AI Score: {item.aiScore}%</span>
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Est. Time</span>
                </div>
                <p className="font-medium mt-1">{item.estimatedReviewTime}m</p>
              </div>

              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <AlertCircle className="w-4 h-4" />
                  <span>Complexity</span>
                </div>
                <p className="font-medium mt-1">{item.complexity}/10</p>
              </div>

              <div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Deadline</span>
                </div>
                <p className={`font-medium mt-1 ${isUrgent ? 'text-red-500' : ''}`}>
                  {daysUntilDeadline > 0 
                    ? `${daysUntilDeadline}d left`
                    : 'Overdue'
                  }
                </p>
              </div>

              {item.aiFindings !== undefined && (
                <div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Brain className="w-4 h-4" />
                    <span>AI Findings</span>
                  </div>
                  <p className="font-medium mt-1">{item.aiFindings} issues</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{item.permitType}</span>
                <span>•</span>
                <span>{item.discipline}</span>
                {item.assignedToName && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{item.assignedToName}</span>
                    </div>
                  </>
                )}
              </div>
              <Link href={`/dashboard/reviews/${item.id}`}>
                <Button size="sm" variant="outline">
                  Review
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

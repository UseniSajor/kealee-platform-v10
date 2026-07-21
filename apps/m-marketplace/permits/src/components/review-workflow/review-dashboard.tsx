/**
 * Review Dashboard Component
 * Displays review progress and coordination status
 */

'use client';

import {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@permits/src/components/ui/card';
import {Progress} from '@permits/src/components/ui/progress';
import {Badge} from '@permits/src/components/ui/badge';
import {Button} from '@permits/src/components/ui/button';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Users,
  FileText,
} from 'lucide-react';
import {reviewProgressTrackingService, ReviewDashboard} from '@permits/src/services/review-workflow/progress-tracking';

interface ReviewDashboardProps {
  permitId: string;
}

export function ReviewDashboardComponent({permitId}: ReviewDashboardProps) {
  const [dashboard, setDashboard] = useState<ReviewDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [permitId]);

  const loadDashboard = async () => {
    try {
      const data = await reviewProgressTrackingService.getReviewDashboard(permitId);
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (!dashboard) {
    return <div>No dashboard data available</div>;
  }

  const {overallProgress, disciplineProgress, timeline, blockers, nextSteps} = dashboard;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Review Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-medium">{overallProgress.overallProgress}%</span>
              </div>
              <Progress value={overallProgress.overallProgress} />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {overallProgress.completedDisciplines}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {overallProgress.inProgressDisciplines}
                </div>
                <div className="text-sm text-gray-500">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {overallProgress.pendingDisciplines}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {overallProgress.correctionsRequired}
                </div>
                <div className="text-sm text-gray-500">Corrections</div>
              </div>
            </div>

            {overallProgress.estimatedCompletionDate && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>
                  Estimated completion:{' '}
                  {overallProgress.estimatedCompletionDate.toLocaleDateString()}
                </span>
              </div>
            )}

            {!overallProgress.onTrack && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span>Review may be behind schedule</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Discipline Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Discipline Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {disciplineProgress.map((discipline) => (
              <div key={discipline.discipline} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{discipline.discipline}</div>
                    <div className="text-sm text-gray-500">
                      Reviewer: {discipline.reviewerName}
                    </div>
                  </div>
                  <Badge
                    variant={
                      discipline.status === 'COMPLETED_APPROVED'
                        ? 'default'
                        : discipline.status === 'COMPLETED_CORRECTIONS_REQUIRED'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {discipline.status.replace('_', ' ')}
                  </Badge>
                </div>

                <div className="mb-2">
                  <Progress value={discipline.progress} />
                </div>

                <div className="flex gap-4 text-sm text-gray-600">
                  <span>
                    <FileText className="w-4 h-4 inline mr-1" />
                    {discipline.commentsCount} comments
                  </span>
                  <span>
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {discipline.correctionsCount} corrections
                  </span>
                  {discipline.estimatedCompletion && (
                    <span>
                      <Clock className="w-4 h-4 inline mr-1" />
                      Est: {discipline.estimatedCompletion.toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blockers & Next Steps */}
      <div className="grid grid-cols-2 gap-4">
        {blockers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                Blockers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {blockers.map((blocker, index) => (
                  <li key={index} className="text-sm text-red-600">
                    • {blocker}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {nextSteps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {nextSteps.map((step, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    • {step}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeline.map((event, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1">
                    {event.type === 'COMPLETED' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {event.type === 'CORRECTIONS_REQUIRED' && (
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    )}
                    {event.type === 'STARTED' && (
                      <Clock className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{event.description}</div>
                    <div className="text-xs text-gray-500">
                      {event.date.toLocaleDateString()} {event.date.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

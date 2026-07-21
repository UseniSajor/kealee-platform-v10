// ============================================================
// MULTI-DISCIPLINE COORDINATION VIEW
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@permits/src/components/ui/card';
import { Badge } from '@permits/src/components/ui/badge';
import { Button } from '@permits/src/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@permits/src/components/ui/tabs';
import { 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  AtSign
} from 'lucide-react';
import { format } from 'date-fns';

interface DisciplineReview {
  discipline: string;
  reviewerId: string;
  reviewerName: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  startedAt?: Date;
  completedAt?: Date;
  commentCount: number;
  mentionCount: number;
  criticalIssues: number;
}

interface MultiDisciplineViewProps {
  permitId: string;
  currentDiscipline: string;
}

export function MultiDisciplineView({
  permitId,
  currentDiscipline,
}: MultiDisciplineViewProps) {
  const [reviews, setReviews] = useState<DisciplineReview[]>([]);
  const [mentions, setMentions] = useState<any[]>([]);

  useEffect(() => {
    fetchDisciplineReviews();
    fetchMentions();
  }, [permitId]);

  const fetchDisciplineReviews = async () => {
    try {
      const response = await fetch(`/api/reviews/permit/${permitId}/disciplines`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
    } catch (error) {
      console.error('Failed to fetch discipline reviews:', error);
    }
  };

  const fetchMentions = async () => {
    try {
      const response = await fetch(`/api/reviews/permit/${permitId}/mentions`);
      if (response.ok) {
        const data = await response.json();
        setMentions(data);
      }
    } catch (error) {
      console.error('Failed to fetch mentions:', error);
    }
  };

  const statusConfig = {
    not_started: { icon: Clock, color: 'outline', label: 'Not Started' },
    in_progress: { icon: Clock, color: 'default', label: 'In Progress' },
    completed: { icon: CheckCircle, color: 'default', label: 'Completed' },
    blocked: { icon: AlertCircle, color: 'destructive', label: 'Blocked' },
  };

  return (
    <div className="p-4 space-y-4">
      <Tabs defaultValue="overview">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">
            Overview
          </TabsTrigger>
          <TabsTrigger value="mentions" className="flex-1">
            Mentions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-3">
          {reviews.map((review) => {
            const config = statusConfig[review.status];
            const Icon = config.icon;
            const isCurrent = review.discipline === currentDiscipline;

            return (
              <Card
                key={review.discipline}
                className={isCurrent ? 'border-primary border-2' : ''}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{review.discipline}</CardTitle>
                    <Badge variant={config.color as any}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{review.reviewerName}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Comments:</span>
                      <span className="ml-1 font-medium">{review.commentCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mentions:</span>
                      <span className="ml-1 font-medium">{review.mentionCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Issues:</span>
                      <span className="ml-1 font-medium text-red-500">
                        {review.criticalIssues}
                      </span>
                    </div>
                  </div>

                  {review.startedAt && (
                    <p className="text-xs text-muted-foreground">
                      Started: {format(new Date(review.startedAt), 'MMM d, yyyy')}
                    </p>
                  )}

                  {review.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Completed: {format(new Date(review.completedAt), 'MMM d, yyyy')}
                    </p>
                  )}

                  {isCurrent && (
                    <Button size="sm" variant="outline" className="w-full mt-2">
                      View Review
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="mentions" className="space-y-2">
          {mentions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AtSign className="w-12 h-12 mx-auto mb-2" />
              <p>No mentions</p>
            </div>
          ) : (
            mentions.map((mention) => (
              <Card key={mention.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AtSign className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-sm">
                        @{mention.mentionedDiscipline}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {mention.fromDiscipline}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{mention.comment}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(mention.createdAt), 'MMM d, yyyy h:mm a')}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

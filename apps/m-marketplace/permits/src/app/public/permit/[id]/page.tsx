/**
 * Public Permit Details Page
 * Public view of permit with timeline, documents, and inspection results
 */

'use client';

import {useState, useEffect} from 'react';
import {useParams} from 'next/navigation';
import {Card, CardContent, CardHeader, CardTitle} from '@permits/src/components/ui/card';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@permits/src/components/ui/tabs';
import {Badge} from '@permits/src/components/ui/badge';
import {Button} from '@permits/src/components/ui/button';
import {
  MapPin,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
} from 'lucide-react';
import {permitSearchService} from '@permits/src/services/public-portal/permit-search';
import {permitTimelineService} from '@permits/src/services/public-portal/permit-timeline';
import {documentViewerService} from '@permits/src/services/public-portal/document-viewer';
import {publicCommentsService} from '@permits/src/services/public-portal/public-comments';

export default function PublicPermitPage() {
  const params = useParams();
  const permitId = params.id as string;

  const [permit, setPermit] = useState<any>(null);
  const [timeline, setTimeline] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [inspectionResults, setInspectionResults] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermitData();
  }, [permitId]);

  const loadPermitData = async () => {
    try {
      // In production, would have a single API endpoint
      // For now, load data separately
      setLoading(true);

      // Load permit, timeline, documents, inspections, comments
      // This would typically be done via API routes
    } catch (error) {
      console.error('Failed to load permit data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="max-w-6xl mx-auto py-8 px-4">Loading...</div>;
  }

  if (!permit) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">Permit not found or not publicly accessible.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Permit Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Permit #{permit.permitNumber}
            </h1>
            <p className="text-xl text-gray-600 mb-4">{permit.type}</p>
          </div>
          <Badge
            variant={
              permit.status === 'ISSUED' || permit.status === 'ACTIVE'
                ? 'default'
                : 'secondary'
            }
            className="text-lg px-4 py-2"
          >
            {permit.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span>{permit.propertyAddress}</span>
          </div>
          {permit.parcelNumber && (
            <div className="flex items-center gap-2 text-gray-600">
              <FileText className="w-5 h-5" />
              <span>Parcel: {permit.parcelNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timeline">
            <Calendar className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="inspections">
            <CheckCircle className="w-4 h-4 mr-2" />
            Inspections
          </TabsTrigger>
          <TabsTrigger value="comments">
            <MessageSquare className="w-4 h-4 mr-2" />
            Comments
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Permit Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline?.events && timeline.events.length > 0 ? (
                <div className="space-y-4">
                  {timeline.events.map((event: any, index: number) => (
                    <div key={event.id || index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            index === timeline.events.length - 1
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          }`}
                        />
                        {index < timeline.events.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{event.title}</h4>
                            <p className="text-sm text-gray-600">{event.description}</p>
                          </div>
                          <span className="text-sm text-gray-500">
                            {event.date.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No timeline events available.</p>
              )}

              {timeline?.nextSteps && timeline.nextSteps.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-2">Next Steps:</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {timeline.nextSteps.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Approved Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-4 border rounded">
                      <div>
                        <h4 className="font-semibold">{doc.name}</h4>
                        <p className="text-sm text-gray-600">{doc.type}</p>
                        {doc.description && (
                          <p className="text-sm text-gray-500 mt-1">{doc.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => window.open(doc.fileUrl, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No documents available for public viewing.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspections Tab */}
        <TabsContent value="inspections">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Results</CardTitle>
            </CardHeader>
            <CardContent>
              {inspectionResults.length > 0 ? (
                <div className="space-y-4">
                  {inspectionResults.map(inspection => (
                    <div key={inspection.inspectionId} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{inspection.type}</h4>
                          <p className="text-sm text-gray-600">
                            #{inspection.inspectionNumber}
                          </p>
                        </div>
                        {inspection.result && (
                          <Badge
                            variant={
                              inspection.result === 'PASS' ||
                              inspection.result === 'PASS_WITH_COMMENTS'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {inspection.result}
                          </Badge>
                        )}
                      </div>
                      {inspection.completedDate && (
                        <p className="text-sm text-gray-600 mb-2">
                          Completed: {inspection.completedDate.toLocaleDateString()}
                        </p>
                      )}
                      {inspection.notes && (
                        <p className="text-sm text-gray-700 mt-2">{inspection.notes}</p>
                      )}
                      {inspection.photos && inspection.photos.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-2">
                          {inspection.photos.slice(0, 4).map((photo: any, index: number) => (
                            <img
                              key={index}
                              src={photo.fileUrl}
                              alt={photo.caption || `Photo ${index + 1}`}
                              className="rounded cursor-pointer hover:opacity-75"
                              onClick={() => window.open(photo.fileUrl, '_blank')}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No inspection results available.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Public Comments</CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment.id} className="border rounded p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{comment.authorName}</h4>
                          <p className="text-sm text-gray-600">
                            {comment.submittedAt.toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline">{comment.category}</Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{comment.comment}</p>
                      {comment.response && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-semibold mb-1">Response:</p>
                          <p className="text-sm text-gray-700">{comment.response}</p>
                          {comment.respondedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {comment.respondedAt.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No public comments yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, Clock, AlertCircle, FileText, Calendar } from 'lucide-react';
import { Card, Badge, ProgressBar } from '@kealee/ui';

interface PermitStatus {
  id: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_changes';
  submittedAt: string;
  estimatedApprovalDate: string;
  currentStep: string;
  steps: Array<{
    id: string;
    name: string;
    status: 'completed' | 'current' | 'upcoming';
    completedAt?: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    status: 'approved' | 'pending' | 'rejected';
  }>;
}

export default function PermitStatusPage() {
  const params = useParams();
  const permitId = params.id as string;
  const [permit, setPermit] = useState<PermitStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPermitStatus();
  }, [permitId]);

  const fetchPermitStatus = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/permits/${permitId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch permit`);
      }

      const data = await response.json();
      const permit = data.permit;

      // Map backend permit data to our PermitStatus interface
      const statusMap: Record<string, PermitStatus['status']> = {
        'DRAFT': 'submitted',
        'SUBMITTED': 'submitted',
        'IN_REVIEW': 'under_review',
        'UNDER_REVIEW': 'under_review',
        'APPROVED': 'approved',
        'REJECTED': 'rejected',
        'CORRECTIONS_REQUIRED': 'requires_changes',
      };

      const permitStatus = statusMap[permit.status] || statusMap[permit.kealeeStatus] || 'submitted';

      // Build steps from permit data
      const steps: PermitStatus['steps'] = [
        {
          id: 'submitted',
          name: 'Application Submitted',
          status: permit.submittedAt ? 'completed' : 'upcoming',
          completedAt: permit.submittedAt || undefined,
        },
        {
          id: 'review',
          name: 'Under Review',
          status: permitStatus === 'under_review' ? 'current' :
                  ['approved', 'rejected', 'requires_changes'].includes(permitStatus) ? 'completed' : 'upcoming',
          completedAt: permit.reviewCompletedAt || undefined,
        },
        {
          id: 'inspection',
          name: 'Site Inspection',
          status: permit.inspectionCompletedAt ? 'completed' :
                  (permitStatus === 'approved' && !permit.inspectionCompletedAt) ? 'current' : 'upcoming',
          completedAt: permit.inspectionCompletedAt || undefined,
        },
        {
          id: 'approval',
          name: 'Approval',
          status: permitStatus === 'approved' ? 'completed' : 'upcoming',
          completedAt: permit.approvedAt || undefined,
        },
      ];

      // Map documents
      const documents = (permit.documents || []).map((doc: any) => ({
        id: doc.id,
        name: doc.fileName || doc.name || 'Document',
        status: doc.status?.toLowerCase() === 'approved' ? 'approved' :
                doc.status?.toLowerCase() === 'rejected' ? 'rejected' : 'pending',
      }));

      const mappedPermit: PermitStatus = {
        id: permit.id,
        status: permitStatus,
        submittedAt: permit.submittedAt || permit.createdAt,
        estimatedApprovalDate: permit.estimatedApprovalDate || permit.dueDate || '',
        currentStep: steps.find(s => s.status === 'current')?.id || 'submitted',
        steps,
        documents,
      };

      setPermit(mappedPermit);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching permit status:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading permit status...</p>
        </div>
      </div>
    );
  }

  if (!permit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Permit Not Found</h2>
          <p className="text-gray-600">The permit you're looking for doesn't exist.</p>
        </Card>
      </div>
    );
  }

  const statusColors = {
    submitted: 'bg-blue-500',
    under_review: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    requires_changes: 'bg-orange-500',
  };

  const completedSteps = permit.steps.filter((s) => s.status === 'completed').length;
  const progress = (completedSteps / permit.steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Permit Application Status
          </h1>
          <p className="text-gray-600">Application ID: {permit.id}</p>
        </div>

        {/* Status Badge */}
        <div className="mb-8">
          <Badge
            variant={permit.status === 'approved' ? 'success' : permit.status === 'rejected' ? 'error' : 'warning'}
            size="lg"
          >
            {permit.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {/* Progress */}
        <Card className="mb-8 p-6">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} variant="success" />
          </div>

          {/* Timeline */}
          <div className="space-y-4 mt-6">
            {permit.steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                  ${step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'current' ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                    'bg-gray-200 text-gray-600'}
                `}>
                  {step.status === 'completed' ? (
                    <CheckCircle size={20} />
                  ) : (
                    <span className="font-semibold">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold ${
                    step.status === 'completed' ? 'text-gray-900' :
                    step.status === 'current' ? 'text-primary-600' :
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </h3>
                  {step.completedAt && (
                    <p className="text-sm text-gray-500">
                      Completed {new Date(step.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Documents */}
        <Card className="mb-8 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={24} />
            Documents
          </h2>
          <div className="space-y-3">
            {permit.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="text-gray-400" size={20} />
                  <span className="font-medium text-gray-900">{doc.name}</span>
                </div>
                <Badge
                  variant={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'warning'}
                >
                  {doc.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={24} />
            Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Submitted</span>
              <span className="font-medium text-gray-900">
                {new Date(permit.submittedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Estimated Approval</span>
              <span className="font-medium text-gray-900">
                {new Date(permit.estimatedApprovalDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

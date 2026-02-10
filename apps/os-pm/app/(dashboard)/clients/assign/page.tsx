'use client';

import { useState, useEffect } from 'react';
import { useRequireAuth } from '@kealee/auth/client';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { ArrowLeft, Users, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface UnassignedClient {
  id: string;
  name: string;
  email: string;
  projectCount: number;
  estimatedWorkload: number; // hours per week
}

interface PM {
  id: string;
  name: string;
  currentWorkload: number; // hours per week
  maxCapacity: number;
  clientCount: number;
}

export default function AssignClientPage() {
  const { user } = useRequireAuth();
  const [availableClients, setAvailableClients] = useState<UnassignedClient[]>([]);
  const [pms, setPMs] = useState<PM[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsResponse, workloadResponse] = await Promise.all([
        api.getAvailableClients(),
        api.getWorkload(),
      ]);
      
      const clientsData: UnassignedClient[] = (clientsResponse.clients || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        email: c.email || '',
        projectCount: c.activeProjects || 0,
        estimatedWorkload: (c.activeProjects || 0) * 5, // Estimate 5hrs per project per week
      }));
      
      const pmsData: PM[] = (workloadResponse.workloads || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        currentWorkload: w.currentWorkload || 0,
        maxCapacity: w.maxCapacity || 40,
        clientCount: w.clientCount || 0,
      }));
      
      setAvailableClients(clientsData);
      setPMs(pmsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    setRequesting(true);

    try {
      await api.requestClientAssignment({
        clientId: selectedClient,
        pmId: user?.id || '',
      });

      toast.success('Assignment request submitted!');
      setTimeout(() => {
        window.location.href = '/clients';
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <Link
          href="/clients"
          className="
            inline-flex items-center gap-2
            text-blue-600 hover:text-blue-700 font-medium
            mb-4
          "
        >
          <ArrowLeft size={20} />
          Back to Clients
        </Link>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Request Client Assignment
        </h1>
        <p className="text-gray-600">
          Select an unassigned client to request assignment
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Available Clients */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Available Clients
            </h2>

            {availableClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No unassigned clients
                </h3>
                <p className="text-gray-600">
                  All clients are currently assigned to PMs
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableClients.map((client: UnassignedClient) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client.id)}
                    className={`
                      w-full p-4
                      border-2 rounded-xl
                      text-left
                      transition-all duration-200
                      ${selectedClient === client.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-900">
                            {client.name}
                          </h3>
                          {selectedClient === client.id && (
                            <CheckCircle className="text-blue-600" size={20} />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {client.email}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{client.projectCount} projects</span>
                          <span>•</span>
                          <span>~{client.estimatedWorkload}hrs/week</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Current Workload */}
        <div>
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Your Workload
            </h2>

            {/* Current Stats */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Current Load</span>
                <span className="text-sm font-semibold text-gray-900">
                  {pms.find((pm: PM) => pm.id === user?.id)?.currentWorkload || 0}hrs / week
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(((pms.find((pm: PM) => pm.id === user?.id)?.currentWorkload || 0) / 40) * 100, 100)}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">0hrs</span>
                <span className="text-xs text-gray-500">40hrs (capacity)</span>
              </div>
            </div>

            {/* Selected Client Impact */}
            {selectedClient && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Impact if assigned:
                </h3>
                <div className="text-sm text-blue-800">
                  <p className="mb-1">
                    + {availableClients.find((c: UnassignedClient) => c.id === selectedClient)?.estimatedWorkload}hrs/week
                  </p>
                  <p className="font-semibold">
                    New total: {
                      (pms.find((pm: PM) => pm.id === user?.id)?.currentWorkload || 0) +
                      (availableClients.find((c: UnassignedClient) => c.id === selectedClient)?.estimatedWorkload || 0)
                    }hrs/week
                  </p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleRequest}
              disabled={!selectedClient || requesting}
              className="
                w-full py-3
                bg-blue-600 hover:bg-blue-700
                text-white font-semibold
                rounded-lg
                shadow-md hover:shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              {requesting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Submitting...
                </>
              ) : (
                'Request Assignment'
              )}
            </button>

            <p className="mt-4 text-xs text-gray-500 text-center">
              Admin will review and approve your request
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

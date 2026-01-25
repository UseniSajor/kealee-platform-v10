'use client';

import { useState } from 'react';
import { Plus, FileText, Save, Play, Settings, Trash2, ChevronRight, Workflow } from 'lucide-react';

interface SOPStep {
  id: string;
  title: string;
  description: string;
  type: 'action' | 'decision' | 'input' | 'output';
  order: number;
}

interface SOP {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: SOPStep[];
  status: 'draft' | 'active' | 'archived';
}

export default function SOPBuilderPage() {
  const [sops] = useState<SOP[]>([
    {
      id: '1',
      name: 'New Lead Qualification',
      description: 'Standard operating procedure for qualifying new leads',
      category: 'Sales',
      steps: [
        { id: '1', title: 'Receive Lead', description: 'Capture lead information', type: 'input', order: 1 },
        { id: '2', title: 'Verify Contact', description: 'Verify contact information', type: 'action', order: 2 },
        { id: '3', title: 'Qualify Lead', description: 'Check if lead meets criteria', type: 'decision', order: 3 },
      ],
      status: 'active',
    },
    {
      id: '2',
      name: 'Project Onboarding',
      description: 'Standard operating procedure for onboarding new projects',
      category: 'Operations',
      steps: [
        { id: '1', title: 'Create Project', description: 'Set up project in system', type: 'action', order: 1 },
        { id: '2', title: 'Assign Team', description: 'Assign team members', type: 'action', order: 2 },
      ],
      status: 'draft',
    },
  ]);

  const [selectedSop, setSelectedSop] = useState<SOP | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'draft': return 'bg-amber-100 text-amber-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStepTypeColor = (type: string) => {
    switch (type) {
      case 'action': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'decision': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'input': return 'bg-green-100 text-green-700 border-green-200';
      case 'output': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SOP Builder</h1>
            <p className="text-sm text-gray-500 mt-1">Create and manage standard operating procedures</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={18} />
            New SOP
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* SOP List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700">Standard Operating Procedures</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {sops.map((sop) => (
              <button
                key={sop.id}
                onClick={() => setSelectedSop(sop)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedSop?.id === sop.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Workflow className="text-gray-400" size={18} />
                    <span className="font-medium text-gray-900">{sop.name}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sop.status)}`}>
                    {sop.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 ml-6">{sop.description}</p>
                <div className="flex items-center gap-2 mt-2 ml-6">
                  <span className="text-xs text-gray-400">{sop.category}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-400">{sop.steps.length} steps</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* SOP Editor */}
        <div className="flex-1 overflow-y-auto">
          {selectedSop ? (
            <div className="p-6">
              {/* SOP Header */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedSop.name}</h2>
                    <p className="text-gray-600 mt-1">{selectedSop.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <Settings size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    <Play size={16} />
                    Run SOP
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700">Workflow Steps</h3>
                  <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                    <Plus size={16} />
                    Add Step
                  </button>
                </div>

                {selectedSop.steps.map((step, index) => (
                  <div key={step.id} className="relative">
                    {index > 0 && (
                      <div className="absolute left-6 -top-4 w-0.5 h-4 bg-gray-200" />
                    )}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getStepTypeColor(step.type)}`}>
                        <FileText size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">Step {step.order}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStepTypeColor(step.type)}`}>
                            {step.type}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{step.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Workflow className="mx-auto mb-4 text-gray-300" size={48} />
                <p>Select an SOP to view or edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

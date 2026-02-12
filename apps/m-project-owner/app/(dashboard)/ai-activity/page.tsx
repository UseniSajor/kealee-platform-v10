'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface AIAction {
  id: string;
  actionType: string;
  description: string;
  decision: string;
  confidence: number;
  createdAt: string;
  appSource: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatFriendlyAction(action: AIAction): string {
  // Convert technical action types to friendly descriptions
  const type = action.actionType;
  if (type.includes('change_order')) return 'Routine change order handled';
  if (type.includes('budget')) return 'Budget variance monitored';
  if (type.includes('bid_reject')) return 'Late bid filtered out';
  if (type.includes('bid_award')) return 'Best contractor identified';
  if (type.includes('weather')) return 'Weather delay adjusted';
  if (type.includes('qa')) return 'Quality issue addressed';
  if (type.includes('task')) return 'Task priority updated';
  if (type.includes('phase')) return 'Phase milestone tracked';
  return action.description;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AIActivityPage() {
  const [actions, setActions] = useState<AIAction[]>([]);
  const [weeklyCount, setWeeklyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder — replace with actual API call
    // fetch('/api/autonomy/projects/{projectId}/actions?pageSize=50')
    setActions([]);
    setWeeklyCount(0);
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Activity</h1>
        <p className="text-gray-600 mt-1">
          See how AI is helping manage your project efficiently.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
            &#9889;
          </div>
          <div>
            <div className="text-3xl font-bold">{weeklyCount}</div>
            <div className="text-sm text-blue-100">routine decisions handled this week</div>
          </div>
        </div>
        <p className="text-sm text-blue-100 mt-3">
          All actions are within your configured limits. Your project manager is notified of every automated decision.
        </p>
      </div>

      {/* Trust Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <TrustBadge
          icon="&#10003;"
          title="Within Limits"
          description="All auto-decisions stay within your approved thresholds"
        />
        <TrustBadge
          icon="&#128064;"
          title="PM Monitored"
          description="Your PM reviews every automated action"
        />
        <TrustBadge
          icon="&#8634;"
          title="Reversible"
          description="Any action can be reverted by your PM"
        />
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent AI Actions</h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading activity...</div>
        ) : actions.length === 0 ? (
          <div className="py-12 text-center">
            <div className="text-gray-300 text-4xl mb-3">&#9889;</div>
            <p className="text-gray-500 text-sm">No AI activity yet</p>
            <p className="text-gray-400 text-xs mt-1">
              AI actions will appear here as your project progresses
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {actions.map(action => (
              <div key={action.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">
                    &#9889;
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {formatFriendlyAction(action)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDate(action.createdAt)}</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Handled</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TrustBadge({ icon, title, description }: {
  icon: string; title: string; description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
    </div>
  );
}

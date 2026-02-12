'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface AutonomousAction {
  id: string;
  projectId: string;
  appSource: string;
  actionType: string;
  description: string;
  decision: 'AUTO_APPROVED' | 'AUTO_REJECTED' | 'AUTO_EXECUTED' | 'ESCALATED';
  reasoning: string;
  data: Record<string, unknown>;
  confidence: number;
  autonomyLevel: number;
  reviewedByPM: boolean;
  reviewedAt: string | null;
  revertedAt: string | null;
  revertedBy: string | null;
  createdAt: string;
}

interface AutonomyStats {
  totalActions: number;
  autoApproved: number;
  autoRejected: number;
  autoExecuted: number;
  escalated: number;
  revertedCount: number;
  reviewedCount: number;
  estimatedHoursSaved: number;
}

interface ProjectConfig {
  projectId: string;
  projectName: string;
  autonomyLevel: number;
  autonomyRules: Record<string, unknown> | null;
  enabledAt: string | null;
  enabledBy: string | null;
}

// ============================================================================
// HELPERS
// ============================================================================

const DECISION_COLORS: Record<string, string> = {
  AUTO_APPROVED: 'bg-green-100 text-green-800',
  AUTO_REJECTED: 'bg-red-100 text-red-800',
  AUTO_EXECUTED: 'bg-blue-100 text-blue-800',
  ESCALATED: 'bg-yellow-100 text-yellow-800',
};

const DECISION_ICONS: Record<string, string> = {
  AUTO_APPROVED: '✓',
  AUTO_REJECTED: '✗',
  AUTO_EXECUTED: '⚡',
  ESCALATED: '⏳',
};

const APP_LABELS: Record<string, string> = {
  'APP-01': 'Bid Engine',
  'APP-03': 'Change Order',
  'APP-07': 'Budget Tracker',
  'APP-09': 'Task Queue',
  'APP-12': 'Smart Scheduler',
  'APP-13': 'QA Inspector',
};

function formatTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================================================
// COMPONENT
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function AutonomousActionsPage() {
  const [actions, setActions] = useState<AutonomousAction[]>([]);
  const [stats, setStats] = useState<AutonomyStats | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [filterDecision, setFilterDecision] = useState<string>('');
  const [filterApp, setFilterApp] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Load projects list on mount
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch(`${API_BASE}/projects`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const projectList = (data.projects || data || []).map((p: any) => ({
            projectId: p.id,
            projectName: p.name || p.title || 'Unnamed',
            autonomyLevel: p.autonomyLevel ?? 1,
            autonomyRules: p.autonomyRules ?? null,
            enabledAt: p.autonomyEnabledAt ?? null,
            enabledBy: p.autonomyEnabledBy ?? null,
          }));
          setProjects(projectList);
          if (projectList.length > 0 && !selectedProject) {
            setSelectedProject(projectList[0].projectId);
          }
        }
      } catch (err) {
        console.warn('Failed to load projects:', err);
      }
    }
    loadProjects();
  }, []);

  // Fetch actions and stats for the selected project
  const fetchData = useCallback(async () => {
    if (!selectedProject) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [actionsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/autonomy/projects/${selectedProject}/actions?pageSize=50`, {
          credentials: 'include',
        }),
        fetch(`${API_BASE}/autonomy/projects/${selectedProject}/stats?days=7`, {
          credentials: 'include',
        }),
      ]);

      if (actionsRes.ok) {
        const actionsData = await actionsRes.json();
        setActions(actionsData.actions || []);
      } else {
        setActions([]);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        setStats({
          totalActions: 0,
          autoApproved: 0,
          autoRejected: 0,
          autoExecuted: 0,
          escalated: 0,
          revertedCount: 0,
          reviewedCount: 0,
          estimatedHoursSaved: 0,
        });
      }
    } catch (err) {
      console.warn('Failed to fetch autonomy data:', err);
      setActions([]);
      setStats({
        totalActions: 0,
        autoApproved: 0,
        autoRejected: 0,
        autoExecuted: 0,
        escalated: 0,
        revertedCount: 0,
        reviewedCount: 0,
        estimatedHoursSaved: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProject]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRevert = async (actionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/autonomy/actions/${actionId}/revert`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        console.error('Failed to revert action:', await res.text());
      }
    } catch (err) {
      console.error('Error reverting action:', err);
    }
    fetchData();
  };

  const handleReview = async (actionId: string) => {
    try {
      const res = await fetch(`${API_BASE}/autonomy/actions/${actionId}/review`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        console.error('Failed to mark action as reviewed:', await res.text());
      }
    } catch (err) {
      console.error('Error marking action reviewed:', err);
    }
    fetchData();
  };

  const filteredActions = actions.filter(a => {
    if (filterDecision && a.decision !== filterDecision) return false;
    if (filterApp && a.appSource !== filterApp) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Autonomous Actions</h1>
        <p className="text-gray-600 mt-1">
          Monitor AI-handled decisions across your projects. Review, revert, or adjust autonomy settings.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Hours Saved"
            value={`${stats.estimatedHoursSaved}h`}
            subtitle="this week"
            color="bg-green-50 text-green-700"
          />
          <StatCard
            label="Auto-Handled"
            value={stats.autoApproved + stats.autoExecuted + stats.autoRejected}
            subtitle="decisions"
            color="bg-blue-50 text-blue-700"
          />
          <StatCard
            label="Escalated"
            value={stats.escalated}
            subtitle="need your review"
            color="bg-yellow-50 text-yellow-700"
          />
          <StatCard
            label="Reverted"
            value={stats.revertedCount}
            subtitle="overridden"
            color="bg-gray-50 text-gray-700"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="">Select Project</option>
          {projects.map(p => (
            <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
          ))}
        </select>

        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={filterDecision}
          onChange={e => setFilterDecision(e.target.value)}
        >
          <option value="">All Decisions</option>
          <option value="AUTO_APPROVED">Auto-Approved</option>
          <option value="AUTO_REJECTED">Auto-Rejected</option>
          <option value="AUTO_EXECUTED">Auto-Executed</option>
          <option value="ESCALATED">Escalated</option>
        </select>

        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={filterApp}
          onChange={e => setFilterApp(e.target.value)}
        >
          <option value="">All Apps</option>
          <option value="APP-01">Bid Engine</option>
          <option value="APP-03">Change Order</option>
          <option value="APP-07">Budget Tracker</option>
          <option value="APP-09">Task Queue</option>
          <option value="APP-12">Smart Scheduler</option>
          <option value="APP-13">QA Inspector</option>
        </select>
      </div>

      {/* Action Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading actions...</div>
        ) : filteredActions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-3">&#9889;</div>
            <p className="text-gray-600 font-medium">No autonomous actions yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Set a project to Autonomy Level 2 or 3 to enable AI-driven decisions
            </p>
          </div>
        ) : (
          filteredActions.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              onRevert={handleRevert}
              onReview={handleReview}
            />
          ))
        )}
      </div>

      {/* Autonomy Level Config */}
      <div className="mt-12 bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Autonomy Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <LevelCard
            level={1}
            title="Level 1 — Recommend"
            description="AI recommends, you decide everything. Current default."
            active={true}
          />
          <LevelCard
            level={2}
            title="Level 2 — Routine Auto"
            description="AI handles routine items (COs under $500, minor QA, weather delays under 3 days). You review major decisions."
            active={false}
          />
          <LevelCard
            level={3}
            title="Level 3 — Full Auto"
            description="AI handles most items (COs under $2K, bid awards for clear winners). Weekly review only."
            active={false}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({ label, value, subtitle, color }: {
  label: string; value: string | number; subtitle: string; color: string;
}) {
  return (
    <div className={`rounded-xl p-4 ${color}`}>
      <div className="text-sm font-medium opacity-75">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs opacity-60 mt-1">{subtitle}</div>
    </div>
  );
}

function ActionCard({ action, onRevert, onReview }: {
  action: AutonomousAction;
  onRevert: (id: string) => void;
  onReview: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Decision Badge */}
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${DECISION_COLORS[action.decision]}`}>
            {DECISION_ICONS[action.decision]} {action.decision.replace('AUTO_', '').replace('_', ' ')}
          </span>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{action.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                {APP_LABELS[action.appSource] || action.appSource}
              </span>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-500">{formatTimeAgo(action.createdAt)}</span>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-500">Confidence: {action.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {!action.reviewedByPM && action.decision !== 'ESCALATED' && (
            <button
              onClick={() => onReview(action.id)}
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Mark Reviewed
            </button>
          )}
          {!action.revertedAt && action.decision !== 'ESCALATED' && (
            <button
              onClick={() => onRevert(action.id)}
              className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
            >
              Revert
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            {expanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            <p><strong>Reasoning:</strong> {action.reasoning}</p>
            {action.revertedAt && (
              <p className="mt-1 text-red-600">
                Reverted at {new Date(action.revertedAt).toLocaleString()} by {action.revertedBy}
              </p>
            )}
            {action.reviewedByPM && (
              <p className="mt-1 text-green-600">
                Reviewed at {action.reviewedAt ? new Date(action.reviewedAt).toLocaleString() : 'N/A'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LevelCard({ level, title, description, active }: {
  level: number; title: string; description: string; active: boolean;
}) {
  return (
    <div className={`rounded-xl border-2 p-4 cursor-pointer transition-colors ${
      active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {level}
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-xs text-gray-600">{description}</p>
    </div>
  );
}

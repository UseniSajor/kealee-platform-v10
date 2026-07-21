import React, { useState, useEffect } from 'react';

export interface LoopRunData {
  id: string;
  projectId: string;
  loopType: string;
  status: string;
  triggerEvent: string;
  confidenceScore: number | null;
  inputSnapshot: any;
  outputSnapshot: any;
  nextAction: any;
}

interface DecisionPanelProps {
  projectId: string;
  onDecisionSubmitted?: () => void;
}

export const DecisionPanel: React.FC<DecisionPanelProps> = ({ projectId, onDecisionSubmitted }) => {
  const [loops, setLoops] = useState<LoopRunData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchLoops();
  }, [projectId]);

  const fetchLoops = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/loops/project/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch loops data');
      const data = await res.json();
      // Filter loops that are in concept selection or project management requiring decision
      setLoops(data.loops || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (loopId: string, option: string, type: string) => {
    try {
      setSubmitting(loopId);
      const res = await fetch(`/api/loops/${loopId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decisionType: type,
          selectedOption: option,
          reason: reasons[loopId] || 'User selected option: ' + option,
          userId: 'current-user',
        }),
      });

      if (!res.ok) throw new Error('Failed to record decision');

      // Refresh list
      await fetchLoops();
      if (onDecisionSubmitted) onDecisionSubmitted();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded mb-4"></div>
        <div className="h-20 bg-slate-800/50 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-800/40 text-red-400 rounded-2xl">
        <p className="font-semibold">Failed to load project brain: {error}</p>
      </div>
    );
  }

  // Active runs requiring client input (e.g. INTAKE_REFINEMENT or general loops with PENDING/RUNNING/AWAITING_REVIEW status)
  const activeRuns = loops.filter(
    (l) => l.status === 'AWAITING_REVIEW' || l.loopType === 'intake_refinement'
  );

  if (activeRuns.length === 0) {
    return (
      <div className="p-6 bg-slate-900/30 backdrop-blur-md border border-slate-800/40 rounded-2xl text-slate-400 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-200 text-lg mb-1">Kealee Brain: Fully Synced</h4>
          <p className="text-sm">No decisions or approvals are currently pending for this project.</p>
        </div>
        <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-ping"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-display">
        <span className="h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
        Required Project Decisions
      </h3>

      {activeRuns.map((run) => {
        const output = run.outputSnapshot || {};
        const digitalTwinUpdates = output.digitalTwinUpdates || {};
        
        // Define what changed & recommend options based on loopType
        const whatChanged = output.summary || `Project event ${run.triggerEvent} triggered an automated design analysis loop.`;
        const recommendation = output.summary 
          ? `We suggest moving forward with the ${output.agentName || 'Kealee Brain'} design concepts.`
          : 'Refining pricing based on 9-question intake data.';

        // Options to display
        const options = run.loopType === 'intake_refinement' 
          ? ['Approve Concept Designs & Estimate', 'Request Re-design & Refinement', 'Cancel Project Study']
          : ['Accept Recommendation & Update Twin', 'Decline & Override Options'];

        return (
          <div
            key={run.id}
            className="p-6 bg-slate-950/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-xl space-y-5 transition-all duration-300 hover:border-slate-700/80"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-900">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-blue-900/40 text-blue-300 rounded-full border border-blue-800/40 uppercase tracking-wider">
                  {run.loopType.replace('_', ' ')}
                </span>
                <h4 className="text-lg font-bold text-slate-100 mt-2 font-display">
                  Action Required: {run.loopType === 'intake_refinement' ? 'Review Concept & Estimate' : 'Review System Recommendation'}
                </h4>
              </div>
              {run.confidenceScore && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">AI Confidence</span>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {(run.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>
              )}
            </div>

            {/* Loop Orchestration UX Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">What Changed</span>
                <p className="text-slate-300 leading-relaxed">{whatChanged}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">What Kealee Recommends</span>
                <p className="text-slate-300 leading-relaxed font-semibold text-blue-400">{recommendation}</p>
              </div>
            </div>

            {/* Digital Twin updates display if present */}
            {digitalTwinUpdates.budget && (
              <div className="p-3 bg-slate-900/40 border border-slate-800/50 rounded-xl flex justify-between items-center text-sm">
                <span className="text-slate-400">Recommended Budget Adjustment</span>
                <span className="font-bold text-slate-200">
                  ${Number(digitalTwinUpdates.budget.total).toLocaleString()}
                </span>
              </div>
            )}

            {/* Decision Options */}
            <div className="space-y-3 pt-3 border-t border-slate-900">
              <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">What Decision is Needed</span>
              
              <textarea
                className="w-full p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-slate-700 placeholder-slate-500"
                placeholder="Optional: Add a message or reasons for your selection..."
                value={reasons[run.id] || ''}
                onChange={(e) => setReasons({ ...reasons, [run.id]: e.target.value })}
              />

              <div className="flex flex-wrap gap-3">
                {options.map((opt) => (
                  <button
                    key={opt}
                    disabled={submitting === run.id}
                    onClick={() => handleDecision(run.id, opt, run.loopType)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-900/20"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="text-xs text-slate-400 bg-slate-900/20 p-3 rounded-xl border border-slate-900">
              <span className="font-semibold text-slate-300 block mb-1">What Happens Next</span>
              <p>
                {run.loopType === 'intake_refinement'
                  ? 'Once approved, Kealee will update the Digital Twin, locks in the pre-construction budget, and starts permit application generation.'
                  : 'Approving updates the live Digital Twin and dispatches contractor engagement pipelines.'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default DecisionPanel;

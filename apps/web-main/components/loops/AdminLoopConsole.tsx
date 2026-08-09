import React, { useState, useEffect } from 'react';
import { LoopRunData } from './DecisionPanel';

export const AdminLoopConsole: React.FC = () => {
  const [loops, setLoops] = useState<LoopRunData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoop, setSelectedLoop] = useState<LoopRunData | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchReviewLoops();
  }, []);

  const fetchReviewLoops = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/loops/review');
      if (!res.ok) throw new Error('Failed to fetch admin review loops');
      const data = await res.json();
      setLoops(data.loops || []);
      if (data.loops && data.loops.length > 0) {
        setSelectedLoop(data.loops[0]);
      } else {
        setSelectedLoop(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (loopId: string) => {
    try {
      setSubmitting(loopId);
      const res = await fetch(`/api/loops/${loopId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'admin-user' }),
      });
      if (!res.ok) throw new Error('Approve action failed');
      await fetchReviewLoops();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async (loopId: string) => {
    try {
      setSubmitting(loopId);
      const res = await fetch(`/api/loops/${loopId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'admin-user', reason }),
      });
      if (!res.ok) throw new Error('Reject action failed');
      await fetchReviewLoops();
      setReason('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleRerun = async (loopId: string) => {
    try {
      setSubmitting(loopId);
      const res = await fetch(`/api/loops/${loopId}/rerun`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Rerun action failed');
      await fetchReviewLoops();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading && loops.length === 0) {
    return <div className="text-white p-8 animate-pulse text-center">Loading Operator Dashboard...</div>;
  }

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-900">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-50">Kealee Command Center</h1>
          <p className="text-sm text-slate-400">v30 Loop Orchestration Operator & Control Console</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={fetchReviewLoops}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            Refresh Logs
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {loops.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-400 font-semibold mb-2">No loops awaiting administrator review</p>
          <p className="text-xs text-slate-500">All automation runs completed or verified successfully.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Loop Run List */}
          <div className="lg:col-span-1 bg-slate-900/30 border border-slate-800/80 rounded-3xl p-5 space-y-4">
            <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider mb-4">Pending Loops Queue</h3>
            
            <div className="space-y-3">
              {loops.map((run) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedLoop(run)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    selectedLoop?.id === run.id
                      ? 'bg-blue-950/25 border-blue-800/80 shadow-md shadow-blue-900/10'
                      : 'bg-slate-950/40 border-slate-900 hover:border-slate-800/80'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded-full border border-blue-800/40">
                      {run.loopType}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {run.id.substring(0, 8)}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-200 mt-1">
                    Project: {run.projectId.substring(0, 13)}...
                  </h4>
                  <div className="flex justify-between items-center mt-3 text-xs">
                    <span className="text-slate-400">Confidence</span>
                    <span className="font-bold text-emerald-400">
                      {run.confidenceScore ? `${(run.confidenceScore * 100).toFixed(0)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audit / Details Panel */}
          {selectedLoop && (
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-900 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-200 font-display">
                      Loop Run Audit Trail: {selectedLoop.loopType.replace('_', ' ').toUpperCase()}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">ID: {selectedLoop.id}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-950/30 border border-amber-800/30 text-amber-400 rounded-full text-xs font-semibold uppercase tracking-wider">
                    {selectedLoop.status}
                  </span>
                </div>

                {/* Agent structured contract results */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">Agent Structured Contract</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-1 text-sm">
                      <span className="text-slate-400 text-xs block">Agent Summary</span>
                      <p>{selectedLoop.outputSnapshot?.summary || 'No agent summary generated.'}</p>
                    </div>

                    <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-1 text-sm">
                      <span className="text-slate-400 text-xs block">Deliverable Impact</span>
                      <p>{JSON.stringify(selectedLoop.outputSnapshot?.deliverableUpdates) || 'None'}</p>
                    </div>
                  </div>
                </div>

                {/* Digital Twin State Change */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">Digital Twin Before/After Diff</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2">
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Twin Before</span>
                      <pre className="max-h-48 overflow-y-auto text-slate-500">
                        {JSON.stringify(selectedLoop.inputSnapshot, null, 2)}
                      </pre>
                    </div>

                    <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-2xl space-y-2">
                      <span className="text-slate-400 font-semibold block uppercase tracking-wider text-[10px]">Proposed Updates (Twin After)</span>
                      <pre className="max-h-48 overflow-y-auto text-blue-400">
                        {JSON.stringify(selectedLoop.outputSnapshot?.digitalTwinUpdates, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                {/* Decisions and overrides controls */}
                <div className="pt-6 border-t border-slate-900 space-y-4">
                  <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">Control Panel Overrides</h3>

                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full p-3 bg-slate-950/60 border border-slate-900 rounded-xl text-slate-200 text-sm focus:outline-none focus:border-slate-800 placeholder-slate-600"
                      placeholder="Specify reject reason (if rejecting)..."
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />

                    <div className="flex gap-4">
                      <button
                        disabled={!!submitting}
                        onClick={() => handleApprove(selectedLoop.id)}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-950/20"
                      >
                        Approve Run & Apply Update
                      </button>
                      <button
                        disabled={!!submitting}
                        onClick={() => handleReject(selectedLoop.id)}
                        className="px-6 py-3 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-red-950/20"
                      >
                        Reject Recommendation
                      </button>
                      <button
                        disabled={!!submitting}
                        onClick={() => handleRerun(selectedLoop.id)}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all duration-200 border border-slate-700"
                      >
                        Rerun Agent
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default AdminLoopConsole;

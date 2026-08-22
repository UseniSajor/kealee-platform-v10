import { AlertTriangle, X } from 'lucide-react';

interface ComplianceAlertProps {
  taskId: string;
  onResolve: () => void;
}

export function ComplianceAlert({ taskId, onResolve }: ComplianceAlertProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">Compliance review required</p>
          <p className="mt-1 text-sm">Review task {taskId} before completion.</p>
        </div>
      </div>
      <button type="button" onClick={onResolve} className="rounded p-1 hover:bg-amber-100" aria-label="Dismiss compliance alert">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

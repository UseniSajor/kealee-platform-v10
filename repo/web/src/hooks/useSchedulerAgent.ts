
import { useState } from 'react';

const API_BASE = '/api/v1';

export interface VisitRequest {
    projectId: string; // usually 'demo-project'
    pmId?: string;
    visitType: string;
    notes?: string;
}

export function useSchedulerAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function scheduleVisit(data: VisitRequest) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/visits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to schedule visit');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return {
        scheduleVisit,
        loading,
        error
    };
}


import { useState } from 'react';

const API_BASE = '/api/v1';

export function useBudgetAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function getSummary(projectId: string) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/projects/${projectId}/budget`);
            if (!response.ok) throw new Error('Failed to get budget summary');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { getSummary, loading, error };
}

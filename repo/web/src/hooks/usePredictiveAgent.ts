
import { useState } from 'react';

const API_BASE = '/api/v1';

export function usePredictiveAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function predictDelay(projectId: string) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/projects/${projectId}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!response.ok) throw new Error('Failed to predict delay');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { predictDelay, loading, error };
}

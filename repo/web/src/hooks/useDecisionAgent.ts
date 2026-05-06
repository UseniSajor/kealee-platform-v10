
import { useState } from 'react';

const API_BASE = '/api/v1';

export function useDecisionAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function getRecommendation(context: any) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/decision/recommend`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(context),
            });
            if (!response.ok) throw new Error('Failed to get recommendation');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { getRecommendation, loading, error };
}

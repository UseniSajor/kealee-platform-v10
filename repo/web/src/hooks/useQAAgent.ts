
import { useState } from 'react';

const API_BASE = '/api/v1';

export function useQAAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function analyzePhoto(data: any) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/qa/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to analyze photo');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { analyzePhoto, loading, error };
}

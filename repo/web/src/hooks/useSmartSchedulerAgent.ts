
import { useState } from 'react';

const API_BASE = '/api/v1';

export function useSmartSchedulerAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function optimizeSchedule(data: any) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/schedule/optimize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to optimize schedule');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { optimizeSchedule, loading, error };
}


import { useState } from 'react';

const API_BASE = '/api/v1';

export function useInspectionAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function scheduleInspection(data: { permitId: string; type: string; preferredDates: string[] }) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/inspections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to schedule inspection');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { scheduleInspection, loading, error };
}

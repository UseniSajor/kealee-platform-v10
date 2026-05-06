
import { useState } from 'react';

const API_BASE = '/api/v1';

export function usePermitAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function checkStatus(permitId: string) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/permits/${permitId}/status`);
            if (!response.ok) throw new Error('Failed to check permit status');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { checkStatus, loading, error };
}


import { useState } from 'react';

const API_BASE = '/api/v1';

export function useReportAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function generateReport(config: { projectId: string; type: string; periodStart: string; periodEnd: string }) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/reports`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });
            if (!response.ok) throw new Error('Failed to generate report');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { generateReport, loading, error };
}

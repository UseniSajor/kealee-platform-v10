
import { useState } from 'react';

const API_BASE = '/api/v1';

export interface ChangeOrderData {
    projectId: string;
    amount: number;
    description: string;
    reason: string;
    scheduleImpact?: number;
}

export function useChangeOrderAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function createChangeOrder(data: ChangeOrderData) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/change-orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error('Failed to create change order');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    async function analyzeImpact(id: string) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/change-orders/${id}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) throw new Error('Failed to analyze impact');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return {
        createChangeOrder,
        analyzeImpact,
        loading,
        error
    };
}

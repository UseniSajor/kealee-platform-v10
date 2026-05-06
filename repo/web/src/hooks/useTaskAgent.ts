
import { useState } from 'react';

const API_BASE = '/api/v1';

export function useTaskAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function createTask(definition: any) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(definition),
            });
            if (!response.ok) throw new Error('Failed to create task');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { createTask, loading, error };
}

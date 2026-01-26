
import { useState } from 'react';

const API_BASE = '/api/v1';

export function useDocAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function generateDoc(data: any) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to generate document');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { generateDoc, loading, error };
}

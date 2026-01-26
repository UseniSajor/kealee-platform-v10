
import { useState } from 'react';

const API_BASE = '/api/v1';

export function useCommunicationAgent() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function sendMessage(data: { projectId: string; recipients: any[]; subject: string; message: string; type: string }) {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error('Failed to send message');
            return await response.json();
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    return { sendMessage, loading, error };
}
